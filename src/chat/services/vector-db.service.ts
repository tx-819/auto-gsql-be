import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorMessage {
  id: number;
  vector: number[];
  payload: {
    userId: number;
    topicId: number;
    role: string;
    content: string;
    timestamp: number;
  };
}

@Injectable()
export class VectorDbService {
  private readonly logger = new Logger(VectorDbService.name);
  private client: QdrantClient;
  private readonly collectionName = 'chat_messages';
  private vectorSize: number = 1536; // 默认维度

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
    });
    this.initCollection();
  }

  private async initCollection() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (col) => col.name === this.collectionName,
      );

      if (!exists) {
        // 等待一小段时间，确保维度已设置
        await new Promise((resolve) => setTimeout(resolve, 100));

        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
        });
        this.logger.log(
          `Created collection: ${this.collectionName} with vector size: ${this.vectorSize}`,
        );
      } else {
        // 获取现有集合的向量维度
        const collectionInfo = await this.client.getCollection(
          this.collectionName,
        );
        const vectorsConfig = collectionInfo.config?.params?.vectors;
        if (
          vectorsConfig &&
          typeof vectorsConfig === 'object' &&
          'size' in vectorsConfig
        ) {
          this.vectorSize = vectorsConfig.size as number;
        }
        this.logger.log(
          `Using existing collection: ${this.collectionName} with vector size: ${this.vectorSize}`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize vector collection', error);
    }
  }

  // 设置向量维度（在创建集合前调用）
  setVectorSize(size: number) {
    this.vectorSize = size;
  }

  async upsertMessage(message: VectorMessage): Promise<void> {
    try {
      // 验证向量维度
      if (message.vector.length !== this.vectorSize) {
        throw new Error(
          `Vector dimension mismatch: expected ${this.vectorSize}, got ${message.vector.length}. ` +
            `Please ensure the embedding model matches the collection configuration.`,
        );
      }

      await this.client.upsert(this.collectionName, {
        points: [
          {
            id: message.id,
            vector: message.vector,
            payload: message.payload,
          },
        ],
      });
    } catch (error) {
      this.logger.error('Failed to upsert message vector', error);
      throw error;
    }
  }

  async searchSimilarMessages(
    vector: number[],
    userId: number,
    limit: number = 10,
    scoreThreshold: number = 0.7,
  ): Promise<VectorMessage[]> {
    try {
      // 验证向量维度
      if (vector.length !== this.vectorSize) {
        throw new Error(
          `Vector dimension mismatch: expected ${this.vectorSize}, got ${vector.length}. ` +
            `Please ensure the embedding model matches the collection configuration.`,
        );
      }

      const result = await this.client.search(this.collectionName, {
        vector,
        limit,
        score_threshold: scoreThreshold,
        filter: {
          must: [
            {
              key: 'userId',
              match: { value: userId },
            },
          ],
        },
      });

      return result.map((point) => ({
        id: point.id as number,
        vector: point.vector as number[],
        payload: point.payload as VectorMessage['payload'],
      }));
    } catch (error) {
      this.logger.error('Failed to search similar messages', error);
      return [];
    }
  }

  async deleteMessagesByTopic(topicId: number): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: 'topicId',
              match: { value: topicId },
            },
          ],
        },
      });
    } catch (error) {
      this.logger.error('Failed to delete messages by topic', error);
      throw error;
    }
  }

  // 删除话题消息的别名方法
  async deleteTopicMessages(topicId: number): Promise<void> {
    return this.deleteMessagesByTopic(topicId);
  }

  // 获取当前向量维度
  getVectorSize(): number {
    return this.vectorSize;
  }
}
