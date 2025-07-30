import { Injectable, Logger } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorMessage {
  id: string;
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
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: 1536, // OpenAI text-embedding-ada-002 维度
            distance: 'Cosine',
          },
        });
        this.logger.log(`Created collection: ${this.collectionName}`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize vector collection', error);
    }
  }

  async upsertMessage(message: VectorMessage): Promise<void> {
    try {
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
        id: point.id as string,
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
}
