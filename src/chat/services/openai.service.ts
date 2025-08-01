import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export interface StreamResponse {
  content: string;
  done: boolean;
}

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);

  private createOpenAI(config: OpenAIConfig): OpenAI {
    const openAIConfig: {
      apiKey: string;
      baseURL?: string;
    } = {
      apiKey: config.apiKey,
    };

    if (config.baseURL) {
      openAIConfig.baseURL = config.baseURL;
    }

    return new OpenAI(openAIConfig);
  }

  async generateResponse(
    messages: ChatMessage[],
    config: OpenAIConfig,
    systemPrompt?: string,
  ): Promise<string> {
    try {
      const openai = this.createOpenAI(config);
      const chatMessages: ChatMessage[] = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      const response = await openai.chat.completions.create({
        model: config.model || 'gpt-3.5-turbo',
        messages: chatMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      this.logger.error('Failed to generate response', error);
      throw error;
    }
  }

  generateResponseStream(
    messages: ChatMessage[],
    config: OpenAIConfig,
    systemPrompt?: string,
  ): Observable<StreamResponse> {
    return new Observable((subscriber) => {
      const openai = this.createOpenAI(config);
      const chatMessages: ChatMessage[] = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages;

      openai.chat.completions
        .create({
          model: config.model || 'gpt-3.5-turbo',
          messages: chatMessages,
          max_tokens: 1000,
          temperature: 0.7,
          stream: true,
        })
        .then(async (stream) => {
          let fullContent = '';

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              subscriber.next({
                content,
                done: false,
              });
            }
          }

          subscriber.next({
            content: fullContent,
            done: true,
          });
          subscriber.complete();
        })
        .catch((error) => {
          this.logger.error('Failed to generate stream response', error);
          subscriber.error(error);
        });
    });
  }

  async generateTopicTitle(
    userMessages: string[],
    config: OpenAIConfig,
  ): Promise<string> {
    try {
      const openai = this.createOpenAI(config);
      const prompt = `基于以下用户消息，生成一个简短的话题标题（不超过10个字）：
${userMessages.join('\n')}

标题：`;

      const response = await openai.chat.completions.create({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的对话标题生成助手。请根据用户消息生成简洁、准确的话题标题。',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 50,
        temperature: 0.3,
      });

      return response.choices[0].message.content?.trim() || '新对话';
    } catch (error) {
      this.logger.error('Failed to generate topic title', error);
      return '新对话';
    }
  }
}
