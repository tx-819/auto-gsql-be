// 调试 EmbeddingService 的简单脚本
// 使用方法: npx ts-node scripts/debug-embedding.ts

import {
  EmbeddingService,
  EmbeddingConfig,
} from '../src/chat/services/embedding.service';

async function testEmbeddingService() {
  console.log('开始测试 EmbeddingService...');

  const embeddingService = new EmbeddingService();

  // 测试文本
  const testText = '这是一个测试文本，用于验证嵌入服务是否正常工作';

  try {
    // 测试本地嵌入
    console.log('\n1. 测试本地嵌入服务...');
    const localConfig: EmbeddingConfig = {
      type: 'local',
      model: 'BAAI/bge-large-zh-v1.5',
    };

    const localEmbedding = await embeddingService.generateEmbedding(
      testText,
      localConfig,
    );
    console.log(
      '本地嵌入结果:',
      localEmbedding.slice(0, 5),
      '... (长度:',
      localEmbedding.length,
      ')',
    );

    // 测试 OpenAI 嵌入（需要 API Key）
    console.log('\n2. 测试 OpenAI 嵌入服务...');
    const openaiConfig: EmbeddingConfig = {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'your-api-key',
      model: 'text-embedding-ada-002',
    };

    const openaiEmbedding = await embeddingService.generateEmbedding(
      testText,
      openaiConfig,
    );
    console.log(
      'OpenAI 嵌入结果:',
      openaiEmbedding.slice(0, 5),
      '... (长度:',
      openaiEmbedding.length,
      ')',
    );
  } catch (error) {
    console.error(
      '测试失败:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

// 运行测试
testEmbeddingService().catch(console.error);
