# 项目更新记录

## 2024-12-19 - 修复向量维度不匹配问题

### 问题描述

- ❌ Qdrant向量数据库出现维度不匹配错误
- ❌ 错误信息：`Vector dimension error: expected dim: 1536, got 1024`
- ❌ 原因：硬编码的向量维度与实际使用的嵌入模型不匹配

### 解决方案

- ✅ 修改VectorDbService支持动态向量维度配置
- ✅ 添加向量维度验证和错误提示
- ✅ 在ChatService初始化时自动检测并设置正确的向量维度
- ✅ 创建Qdrant集合重建脚本解决现有数据问题

### 技术变更

- VectorDbService新增功能：
  - `setVectorSize(size: number)` - 设置向量维度
  - `getVectorSize(): number` - 获取当前向量维度
  - 向量操作前自动验证维度匹配
  - 支持从现有集合读取维度配置
- ChatService新增初始化逻辑：
  - 启动时自动检测嵌入模型维度
  - 动态设置向量数据库维度配置
- 新增脚本 `scripts/recreate-qdrant-collection.ts` 用于重建集合

### 使用说明

如果遇到维度不匹配问题，运行以下命令重建Qdrant集合：

```bash
npx ts-node scripts/recreate-qdrant-collection.ts
```

### 支持的嵌入模型维度

- OpenAI text-embedding-ada-002: 1536维
- OpenAI text-embedding-3-small: 1536维
- 本地模型（如BAAI/bge-large-zh-v1.5）: 1024维
- 其他模型根据实际输出维度自动适配

## 2024-12-19 - 移除物理外键约束，只保留逻辑外键

### 架构调整

- ✅ 移除数据库物理外键约束
- ✅ 移除TypeORM实体关联装饰器
- ✅ 保留逻辑外键关系（通过索引）
- ✅ 创建外键移除迁移脚本

### 技术变更

- 数据库迁移文件更新：
  - 移除 `CONSTRAINT fk_chat_message_topic` 外键约束
  - 保留 `topic_id` 字段的索引用于查询优化
- 实体定义更新：
  - 移除 `@OneToMany` 和 `@ManyToOne` 装饰器
  - 移除 `@JoinColumn` 装饰器
  - 保留基本的字段定义和索引
- 新增迁移文件 `remove-foreign-keys.sql` 用于移除现有外键约束

### 影响分析

- 查询逻辑保持不变，仍通过 `topicId` 字段进行关联查询
- 数据完整性由应用层逻辑保证
- 提高数据库操作灵活性，避免外键约束带来的性能影响
- 支持更灵活的数据操作和迁移策略

### 文件修改

- `src/database/migrations/create-chat-tables.sql` - 移除外键约束
- `src/chat/entities/chat-topic.entity.ts` - 移除关联装饰器
- `src/chat/entities/chat-message.entity.ts` - 移除关联装饰器
- `src/database/migrations/remove-foreign-keys.sql` - 新增外键移除脚本

## 2024-12-19 - 支持自定义AI服务提供商

### 架构调整

- ✅ 修改OpenAiService支持自定义baseURL配置
- ✅ 更新ChatService接口添加baseURL参数
- ✅ 修改ChatController接收客户端baseURL配置
- ✅ 支持DeepSeek等兼容OpenAI API的服务提供商
- ✅ 支持客户端传入模型名称配置
- ✅ 新增Token验证接口

### 技术变更

- OpenAiService新增OpenAIConfig接口：
  - `apiKey: string` - API密钥
  - `baseURL?: string` - 自定义API基础URL
  - `model?: string` - 对话模型名称
  - `embeddingModel?: string` - 向量嵌入模型名称
- 所有OpenAI相关方法签名更新：
  - `generateEmbedding(text, config)`
  - `generateResponse(messages, config, systemPrompt?)`
  - `generateTopicTitle(userMessages, config)`
- SendMessageDto和SendMessageRequestDto接口添加model和embeddingModel字段
- API请求体格式支持模型配置参数
- 新增`GET /auth/validate`接口用于验证JWT Token有效性

### 使用示例

```json
{
  "content": "用户消息",
  "apiKey": "your-api-key",
  "baseURL": "https://api.deepseek.com/v1",
  "model": "deepseek-chat",
  "embeddingModel": "deepseek-embedding"
}
```

### 支持的模型示例

**OpenAI模型**：

- 对话：`gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo-preview`
- 嵌入：`text-embedding-ada-002`, `text-embedding-3-small`

**DeepSeek模型**：

- 对话：`deepseek-chat`, `deepseek-coder`
- 嵌入：`deepseek-embedding`

**其他兼容OpenAI API的服务商**：

- 根据各服务商提供的模型名称配置

## 2024-12-19 - 支持客户端传入OpenAI API Key

### 架构调整

- ✅ 修改OpenAiService支持动态API Key传入
- ✅ 更新ChatService接口添加apiKey参数
- ✅ 修改ChatController接收客户端API Key
- ✅ 更新API文档和部署要求

### 技术变更

- 移除环境变量OPENAI_API_KEY依赖
- OpenAiService方法签名更新：
  - `generateEmbedding(text, apiKey)`
  - `generateResponse(messages, apiKey, systemPrompt?)`
  - `generateTopicTitle(userMessages, apiKey)`
- SendMessageDto接口添加apiKey字段
- API请求体格式更新

### 安全考虑

- API Key由客户端管理，服务端不存储
- 每个请求独立验证API Key有效性
- 支持多用户使用不同API Key

## 2024-12-19 - 多轮对话系统初始版本

### 新增功能

- ✅ 多轮对话系统核心架构
- ✅ 话题聚合和自动标题生成
- ✅ 向量数据库集成 (Qdrant)
- ✅ OpenAI API集成
- ✅ Redis缓存服务
- ✅ MySQL数据持久化

### 技术实现

- ✅ 创建聊天实体 (ChatTopic, ChatMessage)
- ✅ 实现向量数据库服务 (VectorDbService)
- ✅ 实现OpenAI服务 (OpenAiService)
- ✅ 实现聊天缓存服务 (ChatCacheService)
- ✅ 实现核心聊天服务 (ChatService)
- ✅ 创建REST API控制器 (ChatController)
- ✅ 配置聊天模块 (ChatModule)

### 基础设施

- ✅ Docker Compose开发环境配置
- ✅ 数据库迁移脚本
- ✅ 环境变量配置
- ✅ 启动脚本
- ✅ API测试文件
- ✅ 项目文档

### 依赖安装

- ✅ openai: OpenAI API客户端
- ✅ @qdrant/js-client-rest: Qdrant向量数据库客户端 (官方包)

### 文件结构

```
src/chat/
├── entities/
│   ├── chat-topic.entity.ts
│   └── chat-message.entity.ts
├── services/
│   ├── vector-db.service.ts
│   ├── openai.service.ts
│   ├── chat-cache.service.ts
│   └── chat.service.ts
├── chat.controller.ts
└── chat.module.ts

docs/
└── CHAT_SYSTEM.md

scripts/
└── start-dev.sh

test/
└── chat-api.http

docker-compose.dev.yml
env.example
```

### 下一步计划

- 🔄 完善错误处理和日志记录
- 🔄 添加单元测试和集成测试
- 🔄 优化向量检索性能
- 🔄 添加消息流式响应
- 🔄 实现话题合并功能
- 🔄 添加用户权限管理

## 2024-12-19 - 修复Qdrant客户端导入错误

### 问题修复

- ✅ 修复 `qdrant-client` 包导入错误
- ✅ 升级到官方 `@qdrant/js-client-rest` 包
- ✅ 更新 VectorDbService 使用正确的API
- ✅ 解决TypeScript类型错误

### 技术细节

- 原包 `qdrant-client@0.0.1` 版本过旧，API不完整
- 替换为官方包 `@qdrant/js-client-rest@1.15.0`
- 更新导入语句：`import { QdrantClient } from '@qdrant/js-client-rest'`
- 修复所有API调用方法名和参数

## 2024-12-19 - 流式聊天功能

### 新增功能

- 添加了流式聊天API端点 `POST /chat/send/stream`
- 支持Server-Sent Events (SSE)格式的实时流式响应
- 实现了OpenAI流式API的集成

### 技术实现

- 在 `OpenAiService` 中添加了 `generateResponseStream` 方法
- 在 `ChatService` 中添加了 `sendMessageStream` 方法
- 在 `ChatController` 中添加了流式端点，支持SSE响应
- 使用RxJS Observable处理流式数据

### 接口变更

- 新增流式接口：`POST /chat/send/stream`
- 响应格式：Server-Sent Events
- 支持实时流式内容传输

### 文档更新

- 更新了 `docs/CHAT_API.md` 文档
- 添加了流式API的使用示例
- 创建了测试文件 `test/chat-stream.http`

### 文件变更

- `src/chat/services/openai.service.ts` - 添加流式生成方法
- `src/chat/services/chat.service.ts` - 添加流式处理逻辑
- `src/chat/chat.controller.ts` - 添加流式端点
- `docs/CHAT_API.md` - 更新API文档
- `test/chat-stream.http` - 新增测试文件
