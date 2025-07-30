# 认证系统 API 接口文档

## 基础信息

- **基础URL**: `http://localhost:3000`
- **内容类型**: `application/json`

## 接口列表

### 1. 用户注册

**接口地址**: `POST /users/register`

**功能描述**: 创建新用户账户

**请求参数**:

```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com"
}
```

**参数说明**:

| 参数     | 类型   | 必填 | 说明             |
| -------- | ------ | ---- | ---------------- |
| username | string | ✅   | 用户名，必须唯一 |
| password | string | ✅   | 密码，至少6位    |
| email    | string | ❌   | 邮箱地址         |

**响应示例**:

```json
{
  "id": 1,
  "username": "testuser"
}
```

**响应字段说明**:

| 字段     | 类型   | 说明   |
| -------- | ------ | ------ |
| id       | number | 用户ID |
| username | string | 用户名 |

**错误响应**:

```json
{
  "statusCode": 400,
  "message": "用户名已存在",
  "error": "Bad Request"
}
```

### 2. 用户登录

**接口地址**: `POST /auth/login`

**功能描述**: 用户登录并获取JWT Token

**请求参数**:

```json
{
  "username": "testuser",
  "password": "password123"
}
```

**参数说明**:

| 参数     | 类型   | 必填 | 说明   |
| -------- | ------ | ---- | ------ |
| username | string | ✅   | 用户名 |
| password | string | ✅   | 密码   |

**响应示例**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应字段说明**:

| 字段         | 类型   | 说明        |
| ------------ | ------ | ----------- |
| access_token | string | JWT访问令牌 |

**错误响应**:

```json
{
  "statusCode": 401,
  "message": "用户名或密码错误",
  "error": "Unauthorized"
}
```

### 3. 验证Token

**接口地址**: `GET /auth/validate`

**功能描述**: 验证JWT Token是否有效

**请求参数**: 无

**请求头**:

```http
Authorization: Bearer <your-jwt-token>
```

**响应示例**:

```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

**响应字段说明**:

| 字段          | 类型    | 说明          |
| ------------- | ------- | ------------- |
| valid         | boolean | Token是否有效 |
| user          | object  | 用户信息      |
| user.id       | number  | 用户ID        |
| user.username | string  | 用户名        |

**错误响应**:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## JWT Token使用

### Token格式

JWT Token包含以下信息：

- `username`: 用户名
- `sub`: 用户ID
- `iat`: 签发时间
- `exp`: 过期时间

### 在其他接口中使用

获取Token后，在后续请求的请求头中添加：

```http
Authorization: Bearer <your-jwt-token>
```

## 错误码说明

| 状态码 | 说明                                           |
| ------ | ---------------------------------------------- |
| 200    | 请求成功                                       |
| 400    | 请求参数错误（如用户名已存在、密码格式错误等） |
| 401    | 认证失败（用户名或密码错误）                   |
| 500    | 服务器内部错误                                 |

## 使用示例

### JavaScript/TypeScript

```typescript
// 用户注册
const register = async (username: string, password: string, email?: string) => {
  const response = await fetch('/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
      email,
    }),
  });

  if (!response.ok) {
    throw new Error('注册失败');
  }

  return response.json();
};

// 用户登录
const login = async (username: string, password: string) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error('登录失败');
  }

  const data = await response.json();
  return data.access_token;
};

// 使用示例
const main = async () => {
  try {
    // 注册新用户
    await register('newuser', 'password123', 'newuser@example.com');
    console.log('注册成功');

    // 登录
    const token = await login('newuser', 'password123');
    console.log('登录成功，Token:', token);

    // 验证Token
    const validateResponse = await fetch('/auth/validate', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (validateResponse.ok) {
      const validateData = await validateResponse.json();
      console.log('Token有效，用户信息:', validateData.user);
    }

    // 使用Token访问其他接口
    const topicsResponse = await fetch('/chat/topics', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const topics = await topicsResponse.json();
    console.log('话题列表:', topics);
  } catch (error) {
    console.error('操作失败:', error.message);
  }
};
```

### cURL示例

```bash
# 用户注册
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com"
  }'

# 用户登录
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 验证Token
curl -X GET http://localhost:3000/auth/validate \
  -H "Authorization: Bearer your-jwt-token"

# 使用Token访问聊天接口
curl -X GET http://localhost:3000/chat/topics \
  -H "Authorization: Bearer your-jwt-token"
```

## 安全注意事项

1. **密码安全**:
   - 密码使用bcrypt加密存储
   - 建议使用强密码（包含大小写字母、数字、特殊字符）
   - 密码长度至少6位

2. **Token安全**:
   - JWT Token有过期时间
   - 不要在客户端存储敏感信息
   - 定期更换Token

3. **用户名唯一性**:
   - 用户名在系统中必须唯一
   - 注册时会检查用户名是否已存在

4. **输入验证**:
   - 用户名和密码不能为空
   - 邮箱格式验证（如果提供）

## 数据库字段说明

### User表结构

| 字段      | 类型   | 说明           |
| --------- | ------ | -------------- |
| id        | number | 主键，自增     |
| username  | string | 用户名，唯一   |
| password  | string | 加密后的密码   |
| email     | string | 邮箱地址，可选 |
| createdAt | Date   | 创建时间       |
| updatedAt | Date   | 更新时间       |

## 开发环境测试

可以使用以下测试账户进行接口测试：

```bash
# 注册测试用户
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'

# 登录测试
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```
