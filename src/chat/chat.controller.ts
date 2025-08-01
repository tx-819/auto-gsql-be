import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ChatService,
  SendMessageDto,
  StreamChatResponse,
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
  sendMessage(
    @Request() req: { user: AuthenticatedUser },
    @Body() dto: SendMessageRequestDto,
    @Res() res: Response,
  ): void {
    const sendDto: SendMessageDto = {
      userId: req.user.id,
      content: dto.content,
      topicId: dto.topicId,
      apiKey: dto.apiKey,
      baseURL: dto.baseURL,
      model: dto.model,
    };

    // 设置SSE头部
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    const stream = this.chatService.sendMessage(sendDto);

    stream.subscribe({
      next: (response: StreamChatResponse) => {
        const data = JSON.stringify(response);
        res.write(`data: ${data}\n\n`);
      },
      error: (error: Error) => {
        const errorData = JSON.stringify({
          error: error?.message || 'Unknown error',
        });
        res.write(`data: ${errorData}\n\n`);
        res.end();
      },
      complete: () => {
        res.end();
      },
    });
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
