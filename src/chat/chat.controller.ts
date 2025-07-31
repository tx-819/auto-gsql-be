import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ChatService,
  SendMessageDto,
  ChatResponse,
} from './services/chat.service';
import { ChatTopic } from './entities/chat-topic.entity';
import { ChatMessage } from './entities/chat-message.entity';

export class SendMessageRequestDto {
  content: string;
  topicId?: number;
  apiKey: string;
  baseURL?: string;
  model?: string;
}

interface AuthenticatedUser {
  id: number;
  username: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('send')
  async sendMessage(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: SendMessageRequestDto,
  ): Promise<ChatResponse> {
    const sendDto: SendMessageDto = {
      userId: req.user.id,
      content: dto.content,
      topicId: dto.topicId,
      apiKey: dto.apiKey,
      baseURL: dto.baseURL,
      model: dto.model,
    };
    return this.chatService.sendMessage(sendDto);
  }

  @Get('topics')
  async getTopics(
    @Request() req: { user: AuthenticatedUser },
  ): Promise<ChatTopic[]> {
    return this.chatService.getTopics(req.user.id);
  }

  @Get('topics/:topicId/messages')
  async getTopicMessages(
    @Request() req: { user: AuthenticatedUser },
    @Param('topicId') topicId: number,
  ): Promise<ChatMessage[]> {
    return this.chatService.getTopicMessages(topicId, req.user.id);
  }

  @Put('topics/:topicId/archive')
  async archiveTopic(
    @Request() req: { user: AuthenticatedUser },
    @Param('topicId') topicId: number,
  ): Promise<{ success: boolean }> {
    await this.chatService.archiveTopic(topicId, req.user.id);
    return { success: true };
  }
}
