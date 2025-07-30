import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatTopic, TopicStatus } from '../entities/chat-topic.entity';
import { ChatMessage, MessageRole } from '../entities/chat-message.entity';
import { VectorDbService, VectorMessage } from './vector-db.service';
import { OpenAiService, ChatMessage as OpenAiMessage } from './openai.service';
import { ChatCacheService, CachedMessage } from './chat-cache.service';

export interface SendMessageDto {
  userId: number;
  content: string;
  topicId?: number;
  apiKey: string;
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
  ) {}

  async sendMessage(dto: SendMessageDto): Promise<ChatResponse> {
    const { userId, content, topicId, apiKey } = dto;

    // 1. 生成用户消息的向量
    const userVector = await this.openAiService.generateEmbedding(
      content,
      apiKey,
    );

    // 2. 确定话题ID
    let finalTopicId = topicId;
    if (!finalTopicId) {
      finalTopicId = await this.determineTopic(userId, content, userVector);
    }

    // 3. 保存用户消息
    const userMessage = await this.saveMessage({
      topicId: finalTopicId,
      userId,
      role: MessageRole.USER,
      content,
      apiKey,
    });

    // 4. 获取上下文
    const context = await this.getContext(userId, finalTopicId, userVector);

    // 5. 生成AI回复
    const aiResponse = await this.openAiService.generateResponse(
      context.map((msg) => ({ role: msg.role, content: msg.content })),
      apiKey,
      '你是一个有用的AI助手，请根据上下文提供准确、有帮助的回答。',
    );

    // 6. 保存AI回复
    const assistantMessage = await this.saveMessage({
      topicId: finalTopicId,
      userId,
      role: MessageRole.ASSISTANT,
      content: aiResponse,
      apiKey,
    });

    // 7. 生成话题标题（如果是新话题）
    let topicTitle: string | undefined;
    if (!topicId) {
      topicTitle = await this.generateTopicTitle(finalTopicId, content, apiKey);
    }

    // 8. 更新缓存
    await this.updateCache(userId, userMessage, assistantMessage);

    return {
      messageId: assistantMessage.id,
      topicId: finalTopicId,
      content: aiResponse,
      topicTitle,
    };
  }

  private async determineTopic(
    userId: number,
    content: string,
    vector: number[],
  ): Promise<number> {
    // 检查当前活跃话题
    const currentTopicId = await this.chatCacheService.getCurrentTopic(userId);
    if (currentTopicId) {
      const currentTopic = await this.topicRepository.findOne({
        where: { id: currentTopicId, status: TopicStatus.ACTIVE },
      });
      if (currentTopic) {
        return currentTopicId;
      }
    }

    // 搜索相似话题
    const similarMessages = await this.vectorDbService.searchSimilarMessages(
      vector,
      userId,
      5,
      this.SIMILARITY_THRESHOLD,
    );

    if (similarMessages.length > 0) {
      const topicId = similarMessages[0].payload.topicId;
      const topic = await this.topicRepository.findOne({
        where: { id: topicId, status: TopicStatus.ACTIVE },
      });
      if (topic) {
        await this.chatCacheService.setCurrentTopic(userId, topicId);
        return topicId;
      }
    }

    // 创建新话题
    const newTopic = this.topicRepository.create({
      userId,
      status: TopicStatus.ACTIVE,
    });
    const savedTopic = await this.topicRepository.save(newTopic);
    await this.chatCacheService.setCurrentTopic(userId, savedTopic.id);
    return savedTopic.id;
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
      if (!allMessages.find((msg) => msg.id === parseInt(similar.id))) {
        const message = await this.messageRepository.findOne({
          where: { id: parseInt(similar.id) },
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
  }): Promise<ChatMessage> {
    const message = this.messageRepository.create(data);
    const savedMessage = await this.messageRepository.save(message);

    // 保存到向量数据库
    const vector = await this.openAiService.generateEmbedding(
      data.content,
      data.apiKey,
    );
    const vectorMessage: VectorMessage = {
      id: savedMessage.id.toString(),
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

    return savedMessage;
  }

  private async generateTopicTitle(
    topicId: number,
    userMessage: string,
    apiKey: string,
  ): Promise<string> {
    const title = await this.openAiService.generateTopicTitle(
      [userMessage],
      apiKey,
    );

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
