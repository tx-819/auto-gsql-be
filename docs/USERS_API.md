# 用户API文档

## 接口列表

### 1. 用户注册

- **URL**: `POST /users/register`
- **描述**: 注册新用户
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "id": 1,
    "username": "testuser"
  }
  ```

### 2. 用户登录

- **URL**: `POST /auth/login`
- **描述**: 用户登录获取JWT token
- **请求体**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **响应**:
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 3. 获取用户信息

- **URL**: `GET /users/profile`
- **描述**: 获取当前登录用户的详细信息
- **认证**: 需要Bearer Token
- **请求头**:
  ```
  Authorization: Bearer <token>
  ```
- **响应**:
  ```json
  {
    "id": 1,
    "username": "testuser",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
  ```

## 使用示例

### 1. 注册新用户

```bash
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "password123"}'
```

### 2. 用户登录

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "password123"}'
```

### 3. 获取用户信息

```bash
curl -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer <your_jwt_token>"
```

## 错误响应

### 401 Unauthorized

当访问需要认证的接口时未提供有效的JWT token：

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found

当用户不存在时：

```json
{
  "statusCode": 404,
  "message": "User not found"
}
```
