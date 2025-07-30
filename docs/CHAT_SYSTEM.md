# 多轮对话系统功能说明

## 系统架构

### 技术栈

- **后端框架**: NestJS (TypeScript)
- **AI模型**: OpenAI GPT-3.5-turbo + text-embedding-ada-002
- **缓存**: Redis (短期上下文、话题标题缓存)
- **数据库**: MySQL (长期存储消息和话题)
- **向量数据库**: Qdrant (向量存储与检索)

### 核心功能

1. **多轮对话**: 支持上下文记忆的连续对话
2. **话题聚合**: 自动按相似度聚合对话到话题
3. **自动标题**: 为每个话题生成简短标题
4. **历史记录**: 持久化存储所有对话数据
5. **向量检索**: 高效检索相关上下文

## API接口

### 发送消息

```http
POST /chat/send
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "用户消息内容",
  "topicId": 123,  // 可选，指定话题ID
  "apiKey": "your-openai-api-key"
}
```

### 获取话题列表

```http
GET /chat/topics
Authorization: Bearer <jwt-token>
```

### 获取话题消息

```http
GET /chat/topics/{topicId}/messages
Authorization: Bearer <jwt-token>
```

### 归档话题

```http
PUT /chat/topics/{topicId}/archive
Authorization: Bearer <jwt-token>
```

## 环境变量配置

```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=auto_gsql_be

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Qdrant向量数据库配置
QDRANT_URL=http://localhost:6333
```

## 部署要求

1. **MySQL**: 运行数据库迁移脚本
2. **Redis**: 用于缓存对话历史和话题标题
3. **Qdrant**: 向量数据库，用于相似度检索
4. **客户端**: 需要提供OpenAI API Key

## 工作流程

1. 用户发送消息
2. 生成消息向量
3. 在向量数据库中搜索相似历史消息
4. 判断是否属于当前话题或新建话题
5. 保存消息到MySQL和Redis
6. 保存向量到Qdrant
7. 生成AI回复
8. 更新缓存和话题标题
