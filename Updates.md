# 更新记录

## 2024-12-19 - 从物理外键迁移到逻辑外键

### 修改内容

#### 1. 数据库服务 (src/database/database.service.ts)

- 移除了所有物理外键关系查询 (`relations` 参数)
- 更新了以下方法以使用逻辑外键：
  - `findAllConnections()` - 移除 `relations: ['tables']`
  - `findConnectionById()` - 移除 `relations: ['tables']`
  - `findTablesByConnectionId()` - 移除 `relations: ['columns', 'sourceForeignKeys', 'targetForeignKeys']`
  - `findTableById()` - 移除 `relations: ['columns', 'sourceForeignKeys', 'targetForeignKeys']`
  - `findColumnById()` - 移除 `relations: ['table']`
  - `findLogicForeignKeysByTableId()` - 移除 `relations: ['sourceTable', 'targetTable']`
  - `findLogicForeignKeyById()` - 移除 `relations: ['sourceTable', 'targetTable']`

- 新增了增强方法：
  - `getTableWithRelations()` - 获取表及其关联的列和外键关系
  - `getConnectionWithTables()` - 获取连接及其关联的表

#### 2. 数据库控制器 (src/database/database.controller.ts)

- 新增端点：
  - `GET /database/connections/:id/with-tables` - 获取连接及其关联的表
  - `GET /database/tables/:id/with-relations` - 获取表及其关联的列和外键关系

#### 3. 实体文件

- 保持了纯逻辑外键结构，没有物理外键关系装饰器
- `DbTable`、`DbColumn`、`DbLogicForeignKey` 实体保持独立

### 技术细节

#### 逻辑外键实现

- 使用 `DbLogicForeignKey` 实体存储外键关系
- 支持的关系类型：`ONE_TO_ONE`、`ONE_TO_MANY`、`MANY_TO_MANY`
- 通过 `sourceTableId` 和 `targetTableId` 建立逻辑关联
- 通过 `sourceColumnName` 和 `targetColumnName` 指定关联列

#### 查询优化

- 移除了 TypeORM 的物理外键关系查询
- 使用手动查询和过滤来获取关联数据
- 提供了专门的增强方法来获取完整的关联数据

### 影响

- 数据库操作更加灵活，不受物理外键约束
- 支持更复杂的关系类型
- 提高了查询性能（避免了复杂的 JOIN 操作）
- 便于数据迁移和重构

### 兼容性

- 保持了现有的 API 接口
- 新增了增强功能的端点
- 向后兼容现有的数据结构
