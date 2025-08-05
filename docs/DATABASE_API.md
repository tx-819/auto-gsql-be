# 数据库管理 API 接口文档

## 概述

数据库管理模块提供数据库连接、表、列和逻辑外键的完整CRUD操作接口。支持MySQL和PostgreSQL数据库类型。

## 基础信息

- **基础路径**: `/database`
- **支持数据库类型**: MySQL, PostgreSQL
- **关系类型**: one-to-one, one-to-many, many-to-many

## 数据库连接管理

### 创建数据库连接

**POST** `/database/connections`

创建新的数据库连接配置。

**请求参数**:

```json
{
  "name": "string", // 连接名称 (必填)
  "dbType": "mysql|postgres", // 数据库类型 (可选，默认mysql)
  "host": "string", // 主机地址 (必填)
  "port": "number", // 端口号 (必填)
  "username": "string", // 用户名 (可选)
  "password": "string", // 密码 (可选)
  "databaseName": "string" // 数据库名 (必填)
}
```

**响应示例**:

```json
{
  "id": 1,
  "name": "本地MySQL",
  "dbType": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "password",
  "databaseName": "test_db",
  "createTime": "2024-01-01T00:00:00.000Z"
}
```

### 获取所有数据库连接

**GET** `/database/connections`

获取所有数据库连接列表。

**响应示例**:

```json
[
  {
    "id": 1,
    "name": "本地MySQL",
    "dbType": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "root",
    "databaseName": "test_db",
    "createTime": "2024-01-01T00:00:00.000Z"
  }
]
```

### 根据ID获取数据库连接

**GET** `/database/connections/:id`

获取指定ID的数据库连接信息。

**路径参数**:

- `id`: 连接ID (数字)

**响应示例**:

```json
{
  "id": 1,
  "name": "本地MySQL",
  "dbType": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "databaseName": "test_db",
  "createTime": "2024-01-01T00:00:00.000Z"
}
```

### 获取数据库连接及其关联表

**GET** `/database/connections/:id/with-tables`

获取指定连接及其关联的所有表信息。

**路径参数**:

- `id`: 连接ID (数字)

**响应示例**:

```json
{
  "id": 1,
  "name": "本地MySQL",
  "dbType": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "databaseName": "test_db",
  "createTime": "2024-01-01T00:00:00.000Z",
  "tables": [
    {
      "id": 1,
      "tableName": "users",
      "tableComment": "用户表"
    }
  ]
}
```

### 更新数据库连接

**PUT** `/database/connections/:id`

更新指定ID的数据库连接信息。

**路径参数**:

- `id`: 连接ID (数字)

**请求参数**:

```json
{
  "name": "string", // 连接名称 (可选)
  "dbType": "mysql|postgres", // 数据库类型 (可选)
  "host": "string", // 主机地址 (可选)
  "port": "number", // 端口号 (可选)
  "username": "string", // 用户名 (可选)
  "password": "string", // 密码 (可选)
  "databaseName": "string" // 数据库名 (可选)
}
```

**响应示例**:

```json
{
  "id": 1,
  "name": "更新后的连接名",
  "dbType": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "databaseName": "test_db",
  "createTime": "2024-01-01T00:00:00.000Z"
}
```

### 删除数据库连接

**DELETE** `/database/connections/:id`

删除指定ID的数据库连接。

**路径参数**:

- `id`: 连接ID (数字)

**响应示例**:

```json
{
  "message": "Connection deleted successfully"
}
```

## 数据库表管理

### 创建数据库表

**POST** `/database/tables`

创建新的数据库表。

**请求参数**:

```json
{
  "connectionId": "number", // 数据库连接ID (必填)
  "tableName": "string", // 表名 (必填)
  "tableComment": "string" // 表注释 (可选)
}
```

**响应示例**:

```json
{
  "id": 1,
  "connectionId": 1,
  "tableName": "users",
  "tableComment": "用户表"
}
```

### 根据连接ID获取表列表

**GET** `/database/connections/:connectionId/tables`

获取指定数据库连接下的所有表。

**路径参数**:

- `connectionId`: 数据库连接ID (数字)

**响应示例**:

```json
[
  {
    "id": 1,
    "connectionId": 1,
    "tableName": "users",
    "tableComment": "用户表"
  },
  {
    "id": 2,
    "connectionId": 1,
    "tableName": "orders",
    "tableComment": "订单表"
  }
]
```

### 根据ID获取表信息

**GET** `/database/tables/:id`

获取指定ID的表信息。

**路径参数**:

- `id`: 表ID (数字)

**响应示例**:

```json
{
  "id": 1,
  "connectionId": 1,
  "tableName": "users",
  "tableComment": "用户表"
}
```

### 获取表及其关联关系

**GET** `/database/tables/:id/with-relations`

获取指定表及其关联的列和外键关系信息。

**路径参数**:

- `id`: 表ID (数字)

**响应示例**:

```json
{
  "id": 1,
  "connectionId": 1,
  "tableName": "users",
  "tableComment": "用户表",
  "columns": [
    {
      "id": 1,
      "columnName": "id",
      "dataType": "int",
      "isNullable": false,
      "isPrimary": true,
      "columnComment": "主键ID"
    }
  ],
  "foreignKeys": [
    {
      "id": 1,
      "sourceColumnName": "user_id",
      "targetTableId": 2,
      "targetColumnName": "id",
      "relationType": "one-to-many"
    }
  ]
}
```

### 更新表信息

**PUT** `/database/tables/:id`

更新指定ID的表信息。

**路径参数**:

- `id`: 表ID (数字)

**请求参数**:

```json
{
  "tableName": "string", // 表名 (可选)
  "tableComment": "string" // 表注释 (可选)
}
```

**响应示例**:

```json
{
  "id": 1,
  "connectionId": 1,
  "tableName": "updated_users",
  "tableComment": "更新后的用户表"
}
```

### 删除表

**DELETE** `/database/tables/:id`

删除指定ID的表。

**路径参数**:

- `id`: 表ID (数字)

**响应示例**:

```json
{
  "message": "Table deleted successfully"
}
```

## 数据库列管理

### 创建数据库列

**POST** `/database/columns`

创建新的数据库列。

**请求参数**:

```json
{
  "tableId": "number", // 表ID (必填)
  "columnName": "string", // 列名 (必填)
  "dataType": "string", // 数据类型 (必填)
  "isNullable": "boolean", // 是否可为空 (可选，默认true)
  "isPrimary": "boolean", // 是否为主键 (可选，默认false)
  "columnComment": "string" // 列注释 (可选)
}
```

**响应示例**:

```json
{
  "id": 1,
  "tableId": 1,
  "columnName": "id",
  "dataType": "int",
  "isNullable": false,
  "isPrimary": true,
  "columnComment": "主键ID"
}
```

### 根据表ID获取列列表

**GET** `/database/tables/:tableId/columns`

获取指定表的所有列。

**路径参数**:

- `tableId`: 表ID (数字)

**响应示例**:

```json
[
  {
    "id": 1,
    "tableId": 1,
    "columnName": "id",
    "dataType": "int",
    "isNullable": false,
    "isPrimary": true,
    "columnComment": "主键ID"
  },
  {
    "id": 2,
    "tableId": 1,
    "columnName": "name",
    "dataType": "varchar",
    "isNullable": true,
    "isPrimary": false,
    "columnComment": "用户名"
  }
]
```

### 根据ID获取列信息

**GET** `/database/columns/:id`

获取指定ID的列信息。

**路径参数**:

- `id`: 列ID (数字)

**响应示例**:

```json
{
  "id": 1,
  "tableId": 1,
  "columnName": "id",
  "dataType": "int",
  "isNullable": false,
  "isPrimary": true,
  "columnComment": "主键ID"
}
```

### 更新列信息

**PUT** `/database/columns/:id`

更新指定ID的列信息。

**路径参数**:

- `id`: 列ID (数字)

**请求参数**:

```json
{
  "columnName": "string", // 列名 (可选)
  "dataType": "string", // 数据类型 (可选)
  "isNullable": "boolean", // 是否可为空 (可选)
  "isPrimary": "boolean", // 是否为主键 (可选)
  "columnComment": "string" // 列注释 (可选)
}
```

**响应示例**:

```json
{
  "id": 1,
  "tableId": 1,
  "columnName": "updated_id",
  "dataType": "bigint",
  "isNullable": false,
  "isPrimary": true,
  "columnComment": "更新后的主键ID"
}
```

### 删除列

**DELETE** `/database/columns/:id`

删除指定ID的列。

**路径参数**:

- `id`: 列ID (数字)

**响应示例**:

```json
{
  "message": "Column deleted successfully"
}
```

## 逻辑外键管理

### 创建逻辑外键关系

**POST** `/database/foreign-keys`

创建新的逻辑外键关系。

**请求参数**:

```json
{
  "sourceTableId": "number", // 源表ID (必填)
  "sourceColumnName": "string", // 源列名 (必填)
  "targetTableId": "number", // 目标表ID (必填)
  "targetColumnName": "string", // 目标列名 (必填)
  "relationType": "one-to-one|one-to-many|many-to-many" // 关系类型 (可选，默认one-to-many)
}
```

**响应示例**:

```json
{
  "id": 1,
  "sourceTableId": 1,
  "sourceColumnName": "user_id",
  "targetTableId": 2,
  "targetColumnName": "id",
  "relationType": "one-to-many"
}
```

### 根据表ID获取逻辑外键列表

**GET** `/database/tables/:tableId/foreign-keys`

获取指定表的所有逻辑外键关系。

**路径参数**:

- `tableId`: 表ID (数字)

**响应示例**:

```json
[
  {
    "id": 1,
    "sourceTableId": 1,
    "sourceColumnName": "user_id",
    "targetTableId": 2,
    "targetColumnName": "id",
    "relationType": "one-to-many"
  }
]
```

### 根据ID获取逻辑外键信息

**GET** `/database/foreign-keys/:id`

获取指定ID的逻辑外键信息。

**路径参数**:

- `id`: 外键ID (数字)

**响应示例**:

```json
{
  "id": 1,
  "sourceTableId": 1,
  "sourceColumnName": "user_id",
  "targetTableId": 2,
  "targetColumnName": "id",
  "relationType": "one-to-many"
}
```

### 更新逻辑外键信息

**PUT** `/database/foreign-keys/:id`

更新指定ID的逻辑外键信息。

**路径参数**:

- `id`: 外键ID (数字)

**请求参数**:

```json
{
  "sourceColumnName": "string", // 源列名 (可选)
  "targetTableId": "number", // 目标表ID (可选)
  "targetColumnName": "string", // 目标列名 (可选)
  "relationType": "one-to-one|one-to-many|many-to-many" // 关系类型 (可选)
}
```

**响应示例**:

```json
{
  "id": 1,
  "sourceTableId": 1,
  "sourceColumnName": "updated_user_id",
  "targetTableId": 2,
  "targetColumnName": "id",
  "relationType": "one-to-one"
}
```

### 删除逻辑外键

**DELETE** `/database/foreign-keys/:id`

删除指定ID的逻辑外键。

**路径参数**:

- `id`: 外键ID (数字)

**响应示例**:

```json
{
  "message": "Foreign key deleted successfully"
}
```

## 错误响应

所有接口在发生错误时都会返回标准的HTTP错误状态码和错误信息：

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request"
}
```

常见错误状态码：

- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 数据枚举值

### 数据库类型 (DbType)

- `mysql`: MySQL数据库
- `postgres`: PostgreSQL数据库

### 关系类型 (RelationType)

- `one-to-one`: 一对一关系
- `one-to-many`: 一对多关系
- `many-to-many`: 多对多关系
