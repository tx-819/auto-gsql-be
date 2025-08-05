import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { DatabaseService } from './database.service';
import { DbConnection, DbTable, DbColumn, DbLogicForeignKey } from './entities';
import {
  CreateConnectionDto,
  CreateTableDto,
  CreateColumnDto,
  CreateForeignKeyDto,
} from './dto';

/**
 * 数据库管理控制器
 * 提供数据库连接、表、列和外键的CRUD操作接口
 */
@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  // ==================== 数据库连接管理接口 ====================

  /**
   * 创建数据库连接
   * @param connectionData 连接配置数据
   * @returns 创建的连接信息
   */
  @Post('connection')
  async createConnection(@Body() connectionData: CreateConnectionDto) {
    return await this.databaseService.createConnection(connectionData);
  }

  /**
   * 获取所有数据库连接
   * @returns 连接列表
   */
  @Get('connections')
  async findAllConnections() {
    return await this.databaseService.findAllConnections();
  }

  /**
   * 根据ID获取数据库连接
   * @param id 连接ID
   * @returns 连接信息
   */
  @Get('connections/:id')
  async findConnectionById(@Param('id', ParseIntPipe) id: number) {
    return await this.databaseService.findConnectionById(id);
  }

  /**
   * 获取数据库连接及其关联的表信息
   * @param id 连接ID
   * @returns 连接信息和关联表列表
   */
  @Get('connections/:id/with-tables')
  async getConnectionWithTables(@Param('id', ParseIntPipe) id: number) {
    return await this.databaseService.getConnectionWithTables(id);
  }

  /**
   * 更新数据库连接信息
   * @param id 连接ID
   * @param connectionData 更新的连接数据
   * @returns 更新后的连接信息
   */
  @Put('connection/:id')
  async updateConnection(
    @Param('id', ParseIntPipe) id: number,
    @Body() connectionData: Partial<DbConnection>,
  ) {
    return await this.databaseService.updateConnection(id, connectionData);
  }

  /**
   * 删除数据库连接
   * @param id 连接ID
   * @returns 删除成功消息
   */
  @Delete('connection/:id')
  async deleteConnection(@Param('id', ParseIntPipe) id: number) {
    await this.databaseService.deleteConnection(id);
  }

  // ==================== 数据库表管理接口 ====================

  /**
   * 创建数据库表
   * @param tableData 表配置数据
   * @returns 创建的表信息
   */
  @Post('tables')
  async createTable(@Body() tableData: CreateTableDto) {
    return await this.databaseService.createTable(tableData);
  }

  /**
   * 根据连接ID获取表列表
   * @param connectionId 数据库连接ID
   * @returns 表列表
   */
  @Get('connection/:connectionId/tables')
  async findTablesByConnectionId(
    @Param('connectionId', ParseIntPipe) connectionId: number,
  ) {
    return await this.databaseService.findTablesByConnectionId(connectionId);
  }

  /**
   * 根据ID获取表信息
   * @param id 表ID
   * @returns 表信息
   */
  @Get('tables/:id')
  async findTableById(@Param('id', ParseIntPipe) id: number) {
    return await this.databaseService.findTableById(id);
  }

  /**
   * 获取表及其关联关系信息
   * @param id 表ID
   * @returns 表信息和关联关系
   */
  @Get('tables/:id/with-relations')
  async getTableWithRelations(@Param('id', ParseIntPipe) id: number) {
    return await this.databaseService.getTableWithRelations(id);
  }

  /**
   * 更新表信息
   * @param id 表ID
   * @param tableData 更新的表数据
   * @returns 更新后的表信息
   */
  @Put('tables/:id')
  async updateTable(
    @Param('id', ParseIntPipe) id: number,
    @Body() tableData: Partial<DbTable>,
  ) {
    return await this.databaseService.updateTable(id, tableData);
  }

  /**
   * 删除表
   * @param id 表ID
   * @returns 删除成功消息
   */
  @Delete('tables/:id')
  async deleteTable(@Param('id', ParseIntPipe) id: number) {
    await this.databaseService.deleteTable(id);
    return { message: 'Table deleted successfully' };
  }

  // ==================== 数据库列管理接口 ====================

  /**
   * 创建数据库列
   * @param columnData 列配置数据
   * @returns 创建的列信息
   */
  @Post('columns')
  async createColumn(@Body() columnData: CreateColumnDto) {
    return await this.databaseService.createColumn(columnData);
  }

  /**
   * 根据表ID获取列列表
   * @param tableId 表ID
   * @returns 列列表
   */
  @Get('tables/:tableId/columns')
  async findColumnsByTableId(@Param('tableId', ParseIntPipe) tableId: number) {
    return await this.databaseService.findColumnsByTableId(tableId);
  }

  /**
   * 根据ID获取列信息
   * @param id 列ID
   * @returns 列信息
   */
  @Get('columns/:id')
  async findColumnById(@Param('id', ParseIntPipe) id: number) {
    return await this.databaseService.findColumnById(id);
  }

  /**
   * 更新列信息
   * @param id 列ID
   * @param columnData 更新的列数据
   * @returns 更新后的列信息
   */
  @Put('columns/:id')
  async updateColumn(
    @Param('id', ParseIntPipe) id: number,
    @Body() columnData: Partial<DbColumn>,
  ) {
    return await this.databaseService.updateColumn(id, columnData);
  }

  /**
   * 删除列
   * @param id 列ID
   * @returns 删除成功消息
   */
  @Delete('columns/:id')
  async deleteColumn(@Param('id', ParseIntPipe) id: number) {
    await this.databaseService.deleteColumn(id);
    return { message: 'Column deleted successfully' };
  }

  // ==================== 逻辑外键管理接口 ====================

  /**
   * 创建逻辑外键关系
   * @param fkData 外键配置数据
   * @returns 创建的外键信息
   */
  @Post('foreign-keys')
  async createLogicForeignKey(@Body() fkData: CreateForeignKeyDto) {
    return await this.databaseService.createLogicForeignKey(fkData);
  }

  /**
   * 根据表ID获取逻辑外键列表
   * @param tableId 表ID
   * @returns 外键列表
   */
  @Get('tables/:tableId/foreign-keys')
  async findLogicForeignKeysByTableId(
    @Param('tableId', ParseIntPipe) tableId: number,
  ) {
    return await this.databaseService.findLogicForeignKeysByTableId(tableId);
  }

  /**
   * 根据ID获取逻辑外键信息
   * @param id 外键ID
   * @returns 外键信息
   */
  @Get('foreign-keys/:id')
  async findLogicForeignKeyById(@Param('id', ParseIntPipe) id: number) {
    return await this.databaseService.findLogicForeignKeyById(id);
  }

  /**
   * 更新逻辑外键信息
   * @param id 外键ID
   * @param fkData 更新的外键数据
   * @returns 更新后的外键信息
   */
  @Put('foreign-keys/:id')
  async updateLogicForeignKey(
    @Param('id', ParseIntPipe) id: number,
    @Body() fkData: Partial<DbLogicForeignKey>,
  ) {
    return await this.databaseService.updateLogicForeignKey(id, fkData);
  }

  /**
   * 删除逻辑外键
   * @param id 外键ID
   * @returns 删除成功消息
   */
  @Delete('foreign-keys/:id')
  async deleteLogicForeignKey(@Param('id', ParseIntPipe) id: number) {
    await this.databaseService.deleteLogicForeignKey(id);
    return { message: 'Foreign key deleted successfully' };
  }
}
