import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';

export interface CachedMessage {
  id: number;
  topicId: number;
  userId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

@Injectable()
export class ChatCacheService {
  private readonly logger = new Logger(ChatCacheService.name);
  private readonly MAX_HISTORY_SIZE = 50;

  constructor(private readonly redisService: RedisService) {}

  private getHistoryKey(userId: number): string {
    return `chat:history:${userId}`;
  }

  private getTitleKey(userId: number, topicId: number): string {
    return `chat:title:${userId}:${topicId}`;
  }

  // 移除活跃话题相关方法
  // private getCurrentTopicKey(userId: number): string {
  //   return `chat:topic:last:${userId}`;
  // }

  async addMessageToHistory(
    userId: number,
    message: CachedMessage,
  ): Promise<void> {
    try {
      const key = this.getHistoryKey(userId);

      // 获取现有历史记录
      const existingHistory = await this.getRecentHistory(
        userId,
        this.MAX_HISTORY_SIZE,
      );

      // 添加新消息到开头
      const newHistory = [message, ...existingHistory];

      // 保持列表大小限制
      const trimmedHistory = newHistory.slice(0, this.MAX_HISTORY_SIZE);

      // 存储更新后的历史记录
      await this.redisService.set(key, trimmedHistory, 7 * 24 * 60 * 60); // 7天过期
    } catch (error) {
      this.logger.error('Failed to add message to history', error);
    }
  }

  async getRecentHistory(
    userId: number,
    limit: number = 20,
  ): Promise<CachedMessage[]> {
    try {
      const key = this.getHistoryKey(userId);
      const history = await this.redisService.get<CachedMessage[]>(key);

      if (!history) {
        return [];
      }

      return history.slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to get recent history', error);
      return [];
    }
  }

  async getTopicHistory(
    userId: number,
    topicId: number,
  ): Promise<CachedMessage[]> {
    try {
      const key = this.getHistoryKey(userId);
      const history = await this.redisService.get<CachedMessage[]>(key);

      if (!history) {
        return [];
      }

      return history.filter((msg) => msg.topicId === topicId);
    } catch (error) {
      this.logger.error('Failed to get topic history', error);
      return [];
    }
  }

  async setTopicTitle(
    userId: number,
    topicId: number,
    title: string,
  ): Promise<void> {
    try {
      const key = this.getTitleKey(userId, topicId);
      await this.redisService.set(key, title, 30 * 24 * 60 * 60); // 30天过期
    } catch (error) {
      this.logger.error('Failed to set topic title', error);
    }
  }

  async getTopicTitle(userId: number, topicId: number): Promise<string | null> {
    try {
      const key = this.getTitleKey(userId, topicId);
      return await this.redisService.get<string>(key);
    } catch (error) {
      this.logger.error('Failed to get topic title', error);
      return null;
    }
  }

  // 移除活跃话题相关方法
  // async setCurrentTopic(userId: number, topicId: number): Promise<void> {
  //   try {
  //     const key = this.getCurrentTopicKey(userId);
  //     await this.redisService.set(key, topicId.toString(), 24 * 60 * 60); // 1天过期
  //   } catch (error) {
  //     this.logger.error('Failed to set current topic', error);
  //   }
  // }

  // async getCurrentTopic(userId: number): Promise<number | null> {
  //   try {
  //     const key = this.getCurrentTopicKey(userId);
  //     const topicId = await this.redisService.get<string>(key);
  //     return topicId ? parseInt(topicId) : null;
  //   } catch (error) {
  //     this.logger.error('Failed to get current topic', error);
  //   }
  // }

  async clearUserHistory(userId: number): Promise<void> {
    try {
      const historyKey = this.getHistoryKey(userId);
      // 移除活跃话题相关逻辑
      // const currentTopicKey = this.getCurrentTopicKey(userId);

      await this.redisService.del(historyKey);
      // await this.redisService.del(currentTopicKey);
    } catch (error) {
      this.logger.error('Failed to clear user history', error);
    }
  }
}
