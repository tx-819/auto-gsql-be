import { Injectable, Logger } from '@nestjs/common';

export interface EmbeddingConfig {
  type: 'openai' | 'local' | 'baidu' | 'ali';
  apiKey?: string;
  baseURL?: string;
  model?: string;
  // 本地模型配置
  localModelPath?: string;
  // 云服务配置
  accessToken?: string;
  region?: string;
}

export interface EmbeddingProvider {
  generateEmbedding(text: string, config: EmbeddingConfig): Promise<number[]>;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private providers: Map<string, EmbeddingProvider> = new Map();

  constructor() {
    this.registerProviders();
  }

  private registerProviders() {
    this.providers.set('openai', new OpenAIEmbeddingProvider());
    this.providers.set('local', new LocalEmbeddingProvider());
    this.providers.set('baidu', new BaiduEmbeddingProvider());
    this.providers.set('ali', new AliEmbeddingProvider());
  }

  async generateEmbedding(
    text: string,
    config: EmbeddingConfig,
  ): Promise<number[]> {
    const provider = this.providers.get(config.type);
    if (!provider) {
      throw new Error(`Unsupported embedding type: ${config.type}`);
    }

    try {
      return await provider.generateEmbedding(text, config);
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding with ${config.type}`,
        error,
      );
      throw error;
    }
  }
}

// OpenAI嵌入提供者
class OpenAIEmbeddingProvider implements EmbeddingProvider {
  async generateEmbedding(
    text: string,
    config: EmbeddingConfig,
  ): Promise<number[]> {
    const { default: OpenAI } = await import('openai');

    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });

    const response = await openai.embeddings.create({
      model: config.model || 'text-embedding-ada-002',
      input: text,
    });

    return response.data[0].embedding;
  }
}

// 本地嵌入提供者
class LocalEmbeddingProvider implements EmbeddingProvider {
  async generateEmbedding(
    text: string,
    config: EmbeddingConfig,
  ): Promise<number[]> {
    // 调用本地嵌入服务
    const response = await fetch('http://localhost:8888/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model: config.model || 'BAAI/bge-large-zh-v1.5',
      }),
    });

    if (!response.ok) {
      throw new Error(`Local embedding service error: ${response.statusText}`);
    }

    const result = (await response.json()) as { embedding: number[] };
    return result.embedding;
  }
}

// 百度文心嵌入提供者
class BaiduEmbeddingProvider implements EmbeddingProvider {
  async generateEmbedding(
    text: string,
    config: EmbeddingConfig,
  ): Promise<number[]> {
    const response = await fetch(
      'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/embeddings/embedding-v1',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: JSON.stringify({ input: text }),
      },
    );

    if (!response.ok) {
      throw new Error(`Baidu API error: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };
    return result.data[0].embedding;
  }
}

// 阿里云通义千问嵌入提供者
class AliEmbeddingProvider implements EmbeddingProvider {
  async generateEmbedding(
    text: string,
    config: EmbeddingConfig,
  ): Promise<number[]> {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding-v1/text-embedding',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: { text } }),
      },
    );

    if (!response.ok) {
      throw new Error(`Ali API error: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      output: { embeddings: Array<{ embedding: number[] }> };
    };
    return result.output.embeddings[0].embedding;
  }
}
