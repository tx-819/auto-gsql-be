import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatTopic, TopicStatus } from '../entities/chat-topic.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { VectorDbService, VectorMessage } from './vector-db.service';
import { OpenAiService, ChatMessage as OpenAiMessage } from './openai.service';
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
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<ChatResponse> {
    const { userId, content, topicId, apiKey, baseURL, model } = dto;

    // 添加详细的调试日志
    this.logger.log(`sendMessage called with:`, {
      userId,
      content: content.substring(0, 50) + '...',
      topicId,
      hasApiKey: !!apiKey,
      baseURL,
      model,
    });

    // 1. 生成用户消息的向量
    const userVector = await this.embeddingService.generateEmbedding(content, {
      type: 'local',
    });

    // 2. 确定话题ID
    let finalTopicId = topicId;
    if (!finalTopicId) {
      this.logger.log(
        `No topicId provided, creating new topic for user: ${userId}`,
      );
      finalTopicId = await this.determineTopic(userId);
      this.logger.log(`Created new topic with ID: ${finalTopicId}`);
    } else {
      this.logger.log(`Using existing topic ID: ${finalTopicId}`);
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

    // 5. 生成AI回复
    const aiResponse = await this.openAiService.generateResponse(
      context.map((msg) => ({ role: msg.role, content: msg.content })),
      { apiKey, baseURL, model },
      '你是一个有用的AI助手，请根据上下文提供准确、有帮助的回答。',
    );

    // 6. 保存AI回复
    const assistantMessage = await this.saveMessage({
      topicId: finalTopicId,
      userId,
      role: MessageRole.ASSISTANT,
      content: aiResponse,
      apiKey,
      baseURL,
      model,
    });

    // 7. 生成话题标题（如果是新话题）
    let topicTitle: string | undefined;
    if (!topicId) {
      topicTitle = await this.generateTopicTitle(finalTopicId, content, {
        apiKey,
        baseURL,
        model,
      });
    }

    // 8. 更新缓存（移除活跃话题相关逻辑）
    await this.updateCache(userId, userMessage, assistantMessage);

    return {
      messageId: assistantMessage.id,
      topicId: finalTopicId,
      content: aiResponse,
      topicTitle,
    };
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
      take: 10,
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
