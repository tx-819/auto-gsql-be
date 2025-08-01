import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { ChatTopic, TopicStatus } from '../entities/chat-topic.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { VectorDbService, VectorMessage } from './vector-db.service';
import {
  OpenAiService,
  ChatMessage as OpenAiMessage,
  StreamResponse,
} from './openai.service';
import { ChatCacheService, CachedMessage } from './chat-cache.service';
import { EmbeddingService } from './embedding.service';

export interface SendMessageDto {
  userId: number;
  content: string;
  topicId?: number;
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export interface ChatResponse {
  messageId: number;
  topicId: number;
  content: string;
  topicTitle?: string;
}

export interface StreamChatResponse {
  content: string;
  done: boolean;
  messageId?: number;
  topicId?: number;
  topicTitle?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly SIMILARITY_THRESHOLD = 0.8;

  constructor(
    @InjectRepository(ChatTopic)
    private topicRepository: Repository<ChatTopic>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    private vectorDbService: VectorDbService,
    private openAiService: OpenAiService,
    private chatCacheService: ChatCacheService,
    private embeddingService: EmbeddingService,
  ) {
    this.initializeVectorDimension();
  }

  private async initializeVectorDimension() {
    try {
      // 生成一个测试向量来获取维度
      const testVector = await this.embeddingService.generateEmbedding('test', {
        type: 'local',
      });

      // 设置向量数据库的维度
      this.vectorDbService.setVectorSize(testVector.length);
      this.logger.log(`Vector dimension initialized: ${testVector.length}`);
    } catch (error) {
      this.logger.error('Failed to initialize vector dimension', error);
      // 使用默认维度
      this.vectorDbService.setVectorSize(1536);
    }
  }

  sendMessage(dto: SendMessageDto): Observable<StreamChatResponse> {
    return new Observable((subscriber) => {
      this.processStreamMessage(dto, subscriber).catch((error) => {
        this.logger.error('Error in stream message processing:', error);
        subscriber.error(error);
      });
    });
  }

  private async processStreamMessage(
    dto: SendMessageDto,
    subscriber: {
      next: (value: StreamChatResponse) => void;
      error: (error: any) => void;
      complete: () => void;
    },
  ): Promise<void> {
    const { userId, content, topicId, apiKey, baseURL, model } = dto;

    try {
      // 1. 生成用户消息的向量
      const userVector = await this.embeddingService.generateEmbedding(
        content,
        {
          type: 'local',
        },
      );

      // 2. 确定话题ID
      let finalTopicId = topicId;
      if (!finalTopicId) {
        finalTopicId = await this.determineTopic(userId);
      }

      // 3. 保存用户消息
      const userMessage = await this.saveMessage({
        topicId: finalTopicId,
        userId,
        role: MessageRole.USER,
        content,
        apiKey,
        baseURL,
        model,
      });

      // 4. 获取上下文
      const context = await this.getContext(userId, finalTopicId, userVector);

      // 5. 生成话题标题（如果是新话题）
      let topicTitle: string | undefined;
      if (!topicId) {
        topicTitle = await this.generateTopicTitle(finalTopicId, content, {
          apiKey,
          baseURL,
          model,
        });
      }

      // 6. 流式生成AI回复
      let fullContent = '';
      const stream = this.openAiService.generateResponseStream(
        context.map((msg) => ({ role: msg.role, content: msg.content })),
        { apiKey, baseURL, model },
        '你是一个有用的AI助手，请根据上下文提供准确、有帮助的回答。',
      );

      stream.subscribe({
        next: (response: StreamResponse) => {
          if (response.done) {
            fullContent = response.content;
          }
          subscriber.next({
            content: response.content,
            done: response.done,
            topicId: finalTopicId,
            topicTitle: response.done ? topicTitle : undefined,
          });
        },
        error: (error) => {
          this.logger.error('Stream error:', error);
          subscriber.error(error);
        },
        complete: () => {
          // 7. 保存AI回复
          this.saveMessage({
            topicId: finalTopicId,
            userId,
            role: MessageRole.ASSISTANT,
            content: fullContent,
            apiKey,
            baseURL,
            model,
          })
            .then(async (assistantMessage) => {
              // 8. 更新缓存
              await this.updateCache(userId, userMessage, assistantMessage);

              // 发送最终响应
              subscriber.next({
                content: '',
                done: true,
                messageId: assistantMessage.id,
                topicId: finalTopicId,
                topicTitle,
              });
              subscriber.complete();
            })
            .catch((error) => {
              this.logger.error('Error saving assistant message:', error);
              subscriber.error(error);
            });
        },
      });
    } catch (error) {
      this.logger.error('Error in processStreamMessage:', error);
      subscriber.error(error);
    }
  }

  private async determineTopic(userId: number): Promise<number> {
    this.logger.log(
      `determineTopic called with userId: ${userId}, type: ${typeof userId}`,
    );

    try {
      // 创建新话题，设置默认标题
      const newTopic = this.topicRepository.create({
        userId,
        title: '新对话', // 添加默认标题
        status: TopicStatus.ACTIVE,
      });

      this.logger.log(`Created topic entity:`, {
        userId: newTopic.userId,
        title: newTopic.title,
        status: newTopic.status,
      });

      const savedTopic = await this.topicRepository.save(newTopic);
      this.logger.log(
        `Created new topic: ${savedTopic.id} for user: ${userId}`,
      );

      return savedTopic.id;
    } catch (error) {
      this.logger.error(`Failed to create topic for user ${userId}:`, error);
      this.logger.error(`Error details:`, {
        userId,
        userIdType: typeof userId,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Failed to create new topic: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async getContext(
    userId: number,
    topicId: number,
    userVector: number[],
  ): Promise<OpenAiMessage[]> {
    // 1. 获取当前话题的历史消息
    const topicMessages = await this.messageRepository.find({
      where: { topicId, userId },
      order: { createdAt: 'ASC' },
      take: 5,
    });

    // 2. 搜索相似的历史消息
    const similarMessages = await this.vectorDbService.searchSimilarMessages(
      userVector,
      userId,
      5,
      0.7,
    );

    // 3. 合并上下文（去重）
    const allMessages = [...topicMessages];
    for (const similar of similarMessages) {
      if (!allMessages.find((msg) => msg.id === similar.id)) {
        const message = await this.messageRepository.findOne({
          where: { id: similar.id },
        });
        if (message) {
          allMessages.push(message);
        }
      }
    }

    // 4. 转换为OpenAI格式
    return allMessages
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((msg) => ({
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: msg.content,
      }));
  }

  private async saveMessage(data: {
    topicId: number;
    userId: number;
    role: MessageRole;
    content: string;
    apiKey: string;
    baseURL?: string;
    model?: string;
  }): Promise<ChatMessage> {
    try {
      const message = this.messageRepository.create(data);
      const savedMessage = await this.messageRepository.save(message);

      this.logger.log(
        `Saved message: ${savedMessage.id} for topic: ${data.topicId}`,
      );

      // 保存到向量数据库
      const vector = await this.embeddingService.generateEmbedding(
        data.content,
        {
          type: 'local',
        },
      );

      const vectorMessage: VectorMessage = {
        id: savedMessage.id,
        vector,
        payload: {
          userId: data.userId,
          topicId: data.topicId,
          role: data.role,
          content: data.content,
          timestamp: savedMessage.createdAt.getTime(),
        },
      };

      await this.vectorDbService.upsertMessage(vectorMessage);
      this.logger.log(`Saved vector for message: ${savedMessage.id}`);

      return savedMessage;
    } catch (error) {
      this.logger.error(
        `Failed to save message for topic ${data.topicId}:`,
        error,
      );
      throw new Error(
        `Failed to save message: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async generateTopicTitle(
    topicId: number,
    userMessage: string,
    openAIConfig: { apiKey: string; baseURL?: string; model?: string },
  ): Promise<string> {
    const title = await this.openAiService.generateTopicTitle([userMessage], {
      apiKey: openAIConfig.apiKey,
      baseURL: openAIConfig.baseURL,
      model: openAIConfig.model,
    });

    // 更新数据库
    await this.topicRepository.update(topicId, { title });

    // 更新缓存
    const topic = await this.topicRepository.findOne({
      where: { id: topicId },
    });
    if (topic) {
      await this.chatCacheService.setTopicTitle(topic.userId, topicId, title);
    }

    return title;
  }

  private async updateCache(
    userId: number,
    userMessage: ChatMessage,
    assistantMessage: ChatMessage,
  ): Promise<void> {
    const userCachedMessage: CachedMessage = {
      id: userMessage.id,
      topicId: userMessage.topicId,
      userId: userMessage.userId,
      role: userMessage.role,
      content: userMessage.content,
      createdAt: userMessage.createdAt.toISOString(),
    };

    const assistantCachedMessage: CachedMessage = {
      id: assistantMessage.id,
      topicId: assistantMessage.topicId,
      userId: assistantMessage.userId,
      role: assistantMessage.role,
      content: assistantMessage.content,
      createdAt: assistantMessage.createdAt.toISOString(),
    };

    await this.chatCacheService.addMessageToHistory(userId, userCachedMessage);
    await this.chatCacheService.addMessageToHistory(
      userId,
      assistantCachedMessage,
    );
  }

  async getTopics(userId: number): Promise<ChatTopic[]> {
    return this.topicRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getTopicMessages(
    topicId: number,
    userId: number,
  ): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: { topicId, userId },
      order: { createdAt: 'ASC' },
    });
  }

  async archiveTopic(topicId: number, userId: number): Promise<void> {
    await this.topicRepository.update(
      { id: topicId, userId },
      { status: TopicStatus.ARCHIVED },
    );
  }
}
