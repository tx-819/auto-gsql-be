# 聊天系统 API 接口文档

## 基础信息

- **基础URL**: `http://localhost:3000`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`

## 认证

所有接口都需要在请求头中包含JWT Token：

```http
Authorization: Bearer <your-jwt-token>
```

## 接口列表

### 1. 发送消息

**接口地址**: `POST /chat/send`

**功能描述**: 发送用户消息并获取AI回复

**请求参数**:

```json
{
  "content": "用户消息内容",
  "topicId": 123,
  "apiKey": "your-openai-api-key",
  "baseURL": "https://api.deepseek.com/v1",
  "model": "deepseek-chat",
  "embeddingModel": "deepseek-embedding"
}
```

**参数说明**:

| 参数           | 类型   | 必填 | 说明                                     |
| -------------- | ------ | ---- | ---------------------------------------- |
| content        | string | ✅   | 用户消息内容                             |
| topicId        | number | ❌   | 话题ID，不传则创建新话题                 |
| apiKey         | string | ✅   | AI服务API密钥                            |
| baseURL        | string | ❌   | AI服务基础URL，默认使用OpenAI            |
| model          | string | ❌   | 对话模型名称，默认gpt-3.5-turbo          |
| embeddingModel | string | ❌   | 嵌入模型名称，默认text-embedding-ada-002 |

**响应示例**:

```json
{
  "messageId": 456,
  "topicId": 123,
  "content": "AI回复内容",
  "topicTitle": "新话题标题"
}
```

**响应字段说明**:

| 字段       | 类型   | 说明                       |
| ---------- | ------ | -------------------------- |
| messageId  | number | AI回复消息ID               |
| topicId    | number | 话题ID                     |
| content    | string | AI回复内容                 |
| topicTitle | string | 话题标题（仅新话题时返回） |

### 2. 获取话题列表

**接口地址**: `GET /chat/topics`

**功能描述**: 获取当前用户的所有话题列表

**请求参数**: 无

**响应示例**:

```json
[
  {
    "id": 123,
    "userId": 1,
    "title": "人工智能讨论",
    "status": 1,
    "createdAt": "2024-12-19T10:30:00.000Z",
    "updatedAt": "2024-12-19T10:35:00.000Z"
  },
  {
    "id": 124,
    "userId": 1,
    "title": "编程问题咨询",
    "status": 1,
    "createdAt": "2024-12-19T09:00:00.000Z",
    "updatedAt": "2024-12-19T09:15:00.000Z"
  }
]
```

**响应字段说明**:

| 字段      | 类型   | 说明                       |
| --------- | ------ | -------------------------- |
| id        | number | 话题ID                     |
| userId    | number | 用户ID                     |
| title     | string | 话题标题                   |
| status    | number | 话题状态：1-活跃，2-已归档 |
| createdAt | string | 创建时间                   |
| updatedAt | string | 更新时间                   |

### 3. 获取话题消息

**接口地址**: `GET /chat/topics/{topicId}/messages`

**功能描述**: 获取指定话题的所有消息记录

**路径参数**:

| 参数    | 类型   | 必填 | 说明   |
| ------- | ------ | ---- | ------ |
| topicId | number | ✅   | 话题ID |

**响应示例**:

```json
[
  {
    "id": 100,
    "topicId": 123,
    "userId": 1,
    "role": "user",
    "content": "你好，我想了解一下人工智能",
    "createdAt": "2024-12-19T10:30:00.000Z"
  },
  {
    "id": 101,
    "topicId": 123,
    "userId": 1,
    "role": "assistant",
    "content": "你好！人工智能是一个广泛的领域...",
    "createdAt": "2024-12-19T10:30:05.000Z"
  }
]
```

**响应字段说明**:

| 字段      | 类型   | 说明                                  |
| --------- | ------ | ------------------------------------- |
| id        | number | 消息ID                                |
| topicId   | number | 话题ID                                |
| userId    | number | 用户ID                                |
| role      | string | 消息角色：user-用户，assistant-AI助手 |
| content   | string | 消息内容                              |
| createdAt | string | 创建时间                              |

### 4. 归档话题

**接口地址**: `PUT /chat/topics/{topicId}/archive`

**功能描述**: 将指定话题标记为已归档

**路径参数**:

| 参数    | 类型   | 必填 | 说明   |
| ------- | ------ | ---- | ------ |
| topicId | number | ✅   | 话题ID |

**响应示例**:

```json
{
  "success": true
}
```

## 支持的AI模型

### OpenAI模型

**对话模型**:

- `gpt-3.5-turbo` (默认)
- `gpt-4`
- `gpt-4-turbo-preview`

**嵌入模型**:

- `text-embedding-ada-002` (默认)
- `text-embedding-3-small`

### DeepSeek模型

**对话模型**:

- `deepseek-chat`
- `deepseek-coder`

**嵌入模型**:

- `deepseek-embedding`

### 其他兼容OpenAI API的服务商

根据各服务商提供的具体模型名称配置

## 错误响应

当请求出现错误时，会返回以下格式的响应：

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request"
}
```

**常见错误码**:

| 状态码 | 说明                        |
| ------ | --------------------------- |
| 400    | 请求参数错误                |
| 401    | 未授权，需要有效的JWT Token |
| 403    | 禁止访问，权限不足          |
| 404    | 资源不存在                  |
| 500    | 服务器内部错误              |

## 使用示例

### JavaScript/TypeScript

```typescript
// 发送消息
const sendMessage = async (content: string, apiKey: string) => {
  const response = await fetch('/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      content,
      apiKey,
      model: 'gpt-4',
      baseURL: 'https://api.openai.com/v1',
    }),
  });

  return response.json();
};

// 获取话题列表
const getTopics = async () => {
  const response = await fetch('/chat/topics', {
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  return response.json();
};

// 获取话题消息
const getTopicMessages = async (topicId: number) => {
  const response = await fetch(`/chat/topics/${topicId}/messages`, {
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  });

  return response.json();
};
```

### cURL示例

```bash
# 发送消息
curl -X POST http://localhost:3000/chat/send \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "你好",
    "apiKey": "your-api-key"
  }'

# 获取话题列表
curl -X GET http://localhost:3000/chat/topics \
  -H "Authorization: Bearer your-jwt-token"

# 获取话题消息
curl -X GET http://localhost:3000/chat/topics/123/messages \
  -H "Authorization: Bearer your-jwt-token"
```

## 注意事项

1. **API密钥安全**: 客户端需要管理自己的AI服务API密钥，服务端不存储
2. **模型兼容性**: 确保使用的模型与指定的baseURL兼容
3. **话题管理**: 话题会自动根据消息相似度进行聚合
4. **消息历史**: 系统会保存完整的对话历史，支持上下文记忆
5. **向量检索**: 系统使用向量数据库进行相似消息检索，提供更智能的上下文
