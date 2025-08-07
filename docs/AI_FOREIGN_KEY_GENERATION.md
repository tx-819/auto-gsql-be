# AI 生成逻辑外键关系功能

## 概述

本功能使用 OpenAI API 自动分析数据库表结构，识别表之间的逻辑外键关系，并生成相应的 `DbLogicForeignKey` 记录。

## 功能特点

1. **智能识别**：基于表结构和列名模式自动识别外键关系
2. **关系类型判断**：自动判断一对一、一对多、多对多关系
3. **JSON格式输出**：返回标准化的JSON格式外键关系
4. **错误处理**：包含完整的错误处理和日志记录

## API 接口

### 使用AI生成逻辑外键关系

```http
POST /database/connection/{connectionId}/generate-foreign-keys-with-ai
Content-Type: application/json

{
  "openAIConfig": {
    "apiKey": "your-openai-api-key",
    "baseURL": "https://api.openai.com/v1", // 可选
    "model": "gpt-3.5-turbo" // 可选，默认使用 gpt-3.5-turbo
  }
}
```

### 响应格式

```json
[
  {
    "id": 0,
    "sourceTableId": 3,
    "sourceTableName": "orders",
    "sourceColumnName": "user_id",
    "targetTableId": 1,
    "targetTableName": "users",
    "targetColumnName": "id",
    "relationType": "one-to-many"
  },
  {
    "id": 0,
    "sourceTableId": 3,
    "sourceTableName": "orders",
    "sourceColumnName": "product_id",
    "targetTableId": 2,
    "targetTableName": "products",
    "targetColumnName": "id",
    "relationType": "one-to-many"
  }
]
```

## 使用示例

### 1. 准备数据库结构

首先需要创建数据库连接和表结构：

```json
{
  "connectionId": 1,
  "tables": [
    {
      "tableName": "users",
      "columns": ["id", "name", "email"]
    },
    {
      "tableName": "products",
      "columns": ["id", "name", "price"]
    },
    {
      "tableName": "orders",
      "columns": ["id", "user_id", "product_id", "order_date", "quantity"]
    }
  ]
}
```

### 2. 调用AI生成接口

```bash
curl -X POST http://localhost:3000/database/connection/1/generate-foreign-keys-with-ai \
  -H "Content-Type: application/json" \
  -d '{
    "openAIConfig": {
      "apiKey": "sk-your-api-key-here",
      "model": "gpt-3.5-turbo"
    }
  }'
```

### 3. 预期结果

AI会分析表结构并返回：

```json
[
  {
    "sourceTableName": "orders",
    "sourceColumnName": "user_id",
    "targetTableName": "users",
    "targetColumnName": "id"
  },
  {
    "sourceTableName": "orders",
    "sourceColumnName": "product_id",
    "targetTableName": "products",
    "targetColumnName": "id"
  }
]
```

## 提示词结构

系统会动态构建以下格式的提示词：

```
我有以下数据库结构：
users(id, name, email)
products(id, name, price)
orders(id, user_id, product_id, order_date, quantity)

请分析表之间的关系，识别可能的外键关系。请返回 JSON 格式的逻辑外键数组：
[
  {"sourceTableName":"表名","sourceColumnName":"列名","targetTableName":"目标表名","targetColumnName":"目标列名","relationType":"关系类型"}
]

关系类型说明：
- one-to-one: 一对一关系，源表中的一条记录对应目标表中的一条记录
- many-to-one: 多对一关系，源表中的多条记录对应目标表中的一条记录（最常见的外键关系）
- many-to-many: 多对多关系，通过中间表连接两个表

关系方向判断规则：
1. 如果源表有外键列指向目标表，关系方向是：源表 -> 目标表
2. 关系类型根据业务逻辑判断：
   - 一个主表可以有多个子表记录：主表 -> 子表 (one-to-many)
   - 一个子表只能属于一个主表：子表 -> 主表 (many-to-one)
   - 一个分类可以有多个项目：分类表 -> 项目表 (one-to-many)
   - 一个项目只能属于一个分类：项目表 -> 分类表 (many-to-one)

重要：关系方向是从"多"的一方指向"一"的一方！
- 订单表.user_id 指向 用户表.id：订单表 -> 用户表 (many-to-one)
- 订单表.产品_id 指向 产品表.id：订单表 -> 产品表 (many-to-one)
- 评论表.文章_id 指向 文章表.id：评论表 -> 文章表 (many-to-one)
- 学生表.班级_id 指向 班级表.id：学生表 -> 班级表 (many-to-one)

注意：一对多和多对一是同一个关系的不同视角，我们统一使用 many-to-one 表示从"多"指向"一"的关系。

多对多关系识别：
- 如果存在中间表，且中间表只有两个外键列（指向两个不同的表），则这两个表是多对多关系
- 例如：用户角色关联表连接用户表和角色表

注意：
1. 通常外键列名以 "_id" 结尾，但也有可能不是，请仔细分析表结构与列名
2. 目标列通常是目标表的 "id" 列
3. 只返回确实存在关系的表，不要猜测
4. 确保返回的是有效的 JSON 格式
5. 关系方向要正确：从有外键的表指向被引用的表
```

## 关系识别规则

### 1. 一对多/一对一关系

- 列名以 `_id` 结尾
- 目标表名通常是列名去掉 `_id` 后缀
- 支持单复数形式匹配（如 `user_id` → `users` 表）

### 2. 多对多关系

- 中间表包含多个 `_id` 字段
- 自动识别关联表模式

### 3. 关系类型判断

- 如果外键列有唯一约束，则为一对一关系
- 否则默认为多对一关系

## 错误处理

### 常见错误

1. **API密钥无效**

   ```json
   {
     "error": "Failed to generate logic foreign keys with AI",
     "message": "OpenAI API authentication failed"
   }
   ```

2. **JSON解析失败**

   ```json
   {
     "error": "Failed to parse AI response",
     "message": "Invalid JSON format"
   }
   ```

3. **表不存在**
   ```json
   {
     "error": "Table not found",
     "message": "Source or target table does not exist"
   }
   ```

## 配置要求

### 环境变量

```bash
# OpenAI API 配置
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1  # 可选
```

### 依赖服务

- OpenAI API 服务
- 数据库连接服务
- TypeORM 实体管理

## 测试

使用提供的测试文件 `test/ai-foreign-key-test.http` 进行功能测试：

1. 创建数据库连接
2. 生成表结构元数据
3. 调用AI生成外键关系
4. 验证生成结果

## 注意事项

1. **API成本**：每次调用都会消耗 OpenAI API 配额
2. **准确性**：AI识别结果需要人工验证
3. **安全性**：确保API密钥安全存储
4. **性能**：大量表结构可能需要较长处理时间

## 扩展功能

未来可以考虑添加：

1. **批量处理**：支持多个数据库连接批量生成
2. **关系验证**：自动验证生成的关系是否正确
3. **历史记录**：保存AI生成的历史记录
4. **手动修正**：提供手动修正AI识别结果的功能

## 优化效果

### 优化前的问题：

1. **关系方向错误**：`chat_message -> user` 被识别为 `one-to-many`，实际应该是 `many-to-one`
2. **缺少多对多关系识别**：没有识别出通过中间表连接的多对多关系
3. **关系类型理解不准确**：AI对关系类型的理解有偏差

### 优化后的改进：

1. **明确的关系方向规则**：从"多"的一方指向"一"的一方
2. **具体的示例说明**：提供实际的关系示例和业务逻辑解释
3. **多对多关系识别**：明确中间表的识别规则和示例
4. **系统提示词优化**：强调关键规则和关系类型定义

### 预期优化结果：

对于相同的数据库结构，优化后的AI应该返回：

```json
[
  {
    "sourceTableName": "chat_message",
    "sourceColumnName": "user_id",
    "targetTableName": "user",
    "targetColumnName": "id",
    "relationType": "many-to-one"
  },
  {
    "sourceTableName": "chat_message",
    "sourceColumnName": "topic_id",
    "targetTableName": "chat_topic",
    "targetColumnName": "id",
    "relationType": "many-to-one"
  },
  {
    "sourceTableName": "chat_topic",
    "sourceColumnName": "user_id",
    "targetTableName": "user",
    "targetColumnName": "id",
    "relationType": "many-to-one"
  },
  {
    "sourceTableName": "db_table",
    "sourceColumnName": "connection_id",
    "targetTableName": "db_connection",
    "targetColumnName": "id",
    "relationType": "many-to-one"
  },
  {
    "sourceTableName": "db_column",
    "sourceColumnName": "table_id",
    "targetTableName": "db_table",
    "targetColumnName": "id",
    "relationType": "many-to-one"
  },
  {
    "sourceTableName": "db_logic_foreign_key",
    "sourceColumnName": "source_table_id",
    "targetTableName": "db_table",
    "targetColumnName": "id",
    "relationType": "many-to-one"
  },
  {
    "sourceTableName": "db_logic_foreign_key",
    "sourceColumnName": "target_table_id",
    "targetTableName": "db_table",
    "targetColumnName": "id",
    "relationType": "many-to-one"
  },
  {
    "sourceTableName": "user_role",
    "sourceColumnName": "user_id",
    "targetTableName": "user",
    "targetColumnName": "id",
    "relationType": "many-to-one"
  },
  {
    "sourceTableName": "user_role",
    "sourceColumnName": "role_id",
    "targetTableName": "role",
    "targetColumnName": "id",
    "relationType": "many-to-one"
  }
]
```

### 关键改进点：

1. **关系方向正确**：所有关系都是从有外键的表指向被引用的表
2. **关系类型准确**：大部分关系都是 `many-to-one`（标准外键关系）
3. **包含中间表关系**：识别出 `user_role` 表与 `user` 和 `role` 表的关系
4. **支持多对多识别**：通过中间表可以进一步推导出 `user` 和 `role` 的多对多关系
5. **识别复合外键**：正确识别 `db_logic_foreign_key` 表的两个外键都指向 `db_table.id`
6. **非标准命名支持**：识别 `source_table_id`、`target_table_id` 等非标准命名的外键列

### 通用化优化：

#### 业务场景通用化

提示词已经从特定项目表结构改为通用的业务场景：

- **电商系统**：用户、订单、产品、分类
- **内容系统**：文章、评论、用户、分类
- **教育系统**：学生、班级、课程、教师
- **企业系统**：员工、部门、项目、客户

#### 外键命名通用化

支持各种常见的外键命名模式：

- **标准命名**：`user_id`, `product_id`, `category_id`, `order_id`
- **特殊命名**：`source_id`, `target_id`, `parent_id`, `owner_id`, `creator_id`, `manager_id`
- **复合外键**：`buyer_id` 和 `seller_id` 都指向用户表

#### 关系类型通用化

适用于各种业务场景的关系类型：

- **多对一**：多个订单属于一个用户（最常见的外键关系）
- **一对一**：用户和用户详情表
- **多对多**：通过中间表连接用户和角色

注意：一对多和多对一是同一个关系的不同视角，我们统一使用"多对一"表示从"多"指向"一"的关系方向。

- 仔细分析每个表的每一列，不遗漏任何外键关系
