import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './services/chat.service';
import { VectorDbService } from './services/vector-db.service';
import { OpenAiService } from './services/openai.service';
import { ChatCacheService } from './services/chat-cache.service';
import { ChatTopic } from './entities/chat-topic.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { RedisService } from '../common/services/redis.service';
import { EmbeddingService } from './services/embedding.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatTopic, ChatMessage])],
  controllers: [ChatController],
  providers: [
    ChatService,
    VectorDbService,
    OpenAiService,
    ChatCacheService,
    RedisService,
    EmbeddingService,
  ],
  exports: [ChatService],
})
export class ChatModule {}
