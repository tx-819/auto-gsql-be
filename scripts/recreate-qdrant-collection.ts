import { QdrantClient } from '@qdrant/js-client-rest';

async function recreateCollection() {
  const client = new QdrantClient({
    url: process.env.QDRANT_URL || 'http://localhost:6333',
  });

  const collectionName = 'chat_messages';

  try {
    console.log('Checking existing collection...');

    // 检查集合是否存在
    const collections = await client.getCollections();
    const exists = collections.collections.some(
      (col) => col.name === collectionName,
    );

    if (exists) {
      console.log('Deleting existing collection...');
      await client.deleteCollection(collectionName);
      console.log('Collection deleted successfully');
    }

    // 等待一下确保删除完成
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('Creating new collection...');

    // 创建新集合，使用1024维度（适配本地模型）
    await client.createCollection(collectionName, {
      vectors: {
        size: 1024, // 本地模型维度
        distance: 'Cosine',
      },
    });

    console.log('Collection created successfully with vector size: 1024');

    // 验证集合
    const collectionInfo = await client.getCollection(collectionName);
    console.log('Collection info:', {
      name: collectionName,
      vectorSize: collectionInfo.config?.params?.vectors?.size,
      distance: collectionInfo.config?.params?.vectors?.distance,
    });
  } catch (error) {
    console.error('Error recreating collection:', error);
  }
}

// 运行脚本
recreateCollection()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
