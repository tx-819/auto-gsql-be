// 数据库调试脚本
// 使用方法: npx ts-node scripts/debug-database.ts

import { DataSource } from 'typeorm';
import { ChatTopic, TopicStatus } from '../src/chat/entities/chat-topic.entity';
import {
  ChatMessage,
  MessageRole,
} from '../src/chat/entities/chat-message.entity';

async function testDatabaseConnection() {
  console.log('开始测试数据库连接...');

  // 创建数据源
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'auto_gsql',
    entities: [ChatTopic, ChatMessage],
    synchronize: false, // 生产环境不要使用
    logging: true,
  });

  try {
    // 连接数据库
    await dataSource.initialize();
    console.log('✅ 数据库连接成功');

    // 测试创建话题
    console.log('\n测试创建话题...');
    const topicRepository = dataSource.getRepository(ChatTopic);

    const newTopic = topicRepository.create({
      userId: 1,
      title: '测试话题',
      status: TopicStatus.ACTIVE,
    });

    const savedTopic = await topicRepository.save(newTopic);
    console.log('✅ 话题创建成功:', savedTopic);

    // 测试创建消息
    console.log('\n测试创建消息...');
    const messageRepository = dataSource.getRepository(ChatMessage);

    const newMessage = messageRepository.create({
      topicId: savedTopic.id,
      userId: 1,
      role: MessageRole.USER,
      content: '这是一条测试消息',
    });

    const savedMessage = await messageRepository.save(newMessage);
    console.log('✅ 消息创建成功:', savedMessage);

    // 测试查询
    console.log('\n测试查询...');
    const topics = await topicRepository.find({
      where: { userId: 1 },
      relations: ['messages'],
    });
    console.log('✅ 查询成功，找到话题数量:', topics.length);
    console.log('话题详情:', JSON.stringify(topics, null, 2));

    // 清理测试数据
    console.log('\n清理测试数据...');
    await messageRepository.delete({ topicId: savedTopic.id });
    await topicRepository.delete({ id: savedTopic.id });
    console.log('✅ 测试数据清理完成');
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
  } finally {
    // 关闭连接
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }
}

// 运行测试
testDatabaseConnection().catch(console.error);
