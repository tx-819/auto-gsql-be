import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  DbConnection,
  DbTable,
  DbColumn,
  DbLogicForeignKey,
  RelationType,
} from './entities';
import { GenerateDatabaseMetadataDto } from './dto';
import { TableDataVo } from './vo/tableData.vo';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(DbConnection)
    private dbConnectionRepository: Repository<DbConnection>,
    @InjectRepository(DbTable)
    private dbTableRepository: Repository<DbTable>,
    @InjectRepository(DbColumn)
    private dbColumnRepository: Repository<DbColumn>,
    @InjectRepository(DbLogicForeignKey)
    private dbLogicForeignKeyRepository: Repository<DbLogicForeignKey>,
    private dataSource: DataSource,
  ) {}

  // Database Connection methods
  async createConnection(
    connectionData: Partial<DbConnection>,
  ): Promise<DbConnection> {
    const connection = this.dbConnectionRepository.create(connectionData);
    return await this.dbConnectionRepository.save(connection);
  }

  async findAllConnections(): Promise<DbConnection[]> {
    return await this.dbConnectionRepository.find();
  }

  async findConnectionById(id: number): Promise<DbConnection | null> {
    return await this.dbConnectionRepository.findOne({
      where: { id },
    });
  }

  async updateConnection(
    id: number,
    connectionData: Partial<DbConnection>,
  ): Promise<DbConnection | null> {
    await this.dbConnectionRepository.update(id, connectionData);
    return await this.findConnectionById(id);
  }

  async deleteConnection(id: number): Promise<void> {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const tables = await transactionalEntityManager.find(DbTable, {
        where: { connectionId: id },
      });
      const tableIds = tables.map((table) => table.id);

      await transactionalEntityManager.delete(DbTable, {
        connectionId: id,
      });
      await transactionalEntityManager.delete(DbColumn, {
        tableId: In(tableIds),
      });
      await transactionalEntityManager.delete(DbLogicForeignKey, {
        sourceTableId: In(tableIds),
        targetTableId: In(tableIds),
      });
      await transactionalEntityManager.delete(DbConnection, { id });
    });
  }

  // Database Table methods
  async createTable(tableData: Partial<DbTable>): Promise<DbTable> {
    const table = this.dbTableRepository.create(tableData);
    return await this.dbTableRepository.save(table);
  }

  async findTablesByConnectionId(connectionId: number): Promise<DbTable[]> {
    return await this.dbTableRepository.find({
      where: { connectionId },
    });
  }

  async findTableById(id: number): Promise<DbTable | null> {
    return await this.dbTableRepository.findOne({
      where: { id },
    });
  }

  async updateTable(
    id: number,
    tableData: Partial<DbTable>,
  ): Promise<DbTable | null> {
    await this.dbTableRepository.update(id, tableData);
    return await this.findTableById(id);
  }

  async deleteTable(id: number): Promise<void> {
    await this.dbTableRepository.delete(id);
  }

  // Database Column methods
  async createColumn(columnData: Partial<DbColumn>): Promise<DbColumn> {
    const column = this.dbColumnRepository.create(columnData);
    return await this.dbColumnRepository.save(column);
  }

  async findColumnsByTableId(tableId: number): Promise<DbColumn[]> {
    return await this.dbColumnRepository.find({
      where: { tableId },
    });
  }

  async findColumnById(id: number): Promise<DbColumn | null> {
    return await this.dbColumnRepository.findOne({
      where: { id },
    });
  }

  async updateColumn(
    id: number,
    columnData: Partial<DbColumn>,
  ): Promise<DbColumn | null> {
    await this.dbColumnRepository.update(id, columnData);
    return await this.findColumnById(id);
  }

  async deleteColumn(id: number): Promise<void> {
    await this.dbColumnRepository.delete(id);
  }

  // Logic Foreign Key methods
  async createLogicForeignKey(
    fkData: Partial<DbLogicForeignKey>,
  ): Promise<DbLogicForeignKey> {
    const fk = this.dbLogicForeignKeyRepository.create(fkData);
    return await this.dbLogicForeignKeyRepository.save(fk);
  }

  async findLogicForeignKeysByTableId(
    tableId: number,
  ): Promise<DbLogicForeignKey[]> {
    return await this.dbLogicForeignKeyRepository.find({
      where: [{ sourceTableId: tableId }, { targetTableId: tableId }],
    });
  }

  async findLogicForeignKeysByConnectionId(
    connectionId: number,
  ): Promise<DbLogicForeignKey[]> {
    const connection = await this.findConnectionById(connectionId);
    if (!connection) return [];

    const tables = await this.findTablesByConnectionId(connectionId);

    if (tables.length === 0) return [];

    // 获取所有表ID
    const tableIds = tables.map((table) => table.id);

    // 查询所有涉及这些表的外键关系（作为源表或目标表）
    const foreignKeys = await this.dbLogicForeignKeyRepository.find({
      where: [{ sourceTableId: In(tableIds) }, { targetTableId: In(tableIds) }],
    });

    return foreignKeys;
  }

  async findLogicForeignKeyById(id: number): Promise<DbLogicForeignKey | null> {
    return await this.dbLogicForeignKeyRepository.findOne({
      where: { id },
    });
  }

  async updateLogicForeignKey(
    id: number,
    fkData: Partial<DbLogicForeignKey>,
  ): Promise<DbLogicForeignKey | null> {
    await this.dbLogicForeignKeyRepository.update(id, fkData);
    return await this.findLogicForeignKeyById(id);
  }

  async deleteLogicForeignKey(id: number): Promise<void> {
    await this.dbLogicForeignKeyRepository.delete(id);
  }

  // Enhanced methods for working with logical relationships
  async getTableWithRelations(tableId: number): Promise<{
    table: DbTable;
    columns: DbColumn[];
    sourceForeignKeys: DbLogicForeignKey[];
    targetForeignKeys: DbLogicForeignKey[];
  } | null> {
    const table = await this.findTableById(tableId);
    if (!table) return null;

    const columns = await this.findColumnsByTableId(tableId);
    const allForeignKeys = await this.findLogicForeignKeysByTableId(tableId);

    const sourceForeignKeys = allForeignKeys.filter(
      (fk) => fk.sourceTableId === tableId,
    );
    const targetForeignKeys = allForeignKeys.filter(
      (fk) => fk.targetTableId === tableId,
    );

    return {
      table,
      columns,
      sourceForeignKeys,
      targetForeignKeys,
    };
  }

  async getConnectionWithTables(connectionId: number): Promise<{
    connection: DbConnection;
    tables: DbTable[];
  } | null> {
    const connection = await this.findConnectionById(connectionId);
    if (!connection) return null;

    const tables = await this.findTablesByConnectionId(connectionId);

    return {
      connection,
      tables,
    };
  }

  async getTablesWithColumns(connectionId: number): Promise<TableDataVo[]> {
    // 使用现有的Repository方法，避免复杂的类型问题
    const tables = await this.findTablesByConnectionId(connectionId);
    const tablesWithColumns = await Promise.all(
      tables.map(async (table) => {
        const columns = await this.findColumnsByTableId(table.id);
        return {
          ...table,
          columns,
        } as TableDataVo;
      }),
    );
    return tablesWithColumns;
  }

  async generateLogicForeignKeys(
    connectionId: number,
    uniqueCols: string[],
  ): Promise<void> {
    // 使用事务确保数据一致性
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // 1. 获取所有表和列
      const sql = `
        SELECT 
          t.id AS tableId, 
          t.table_name AS tableName, 
          c.id AS columnId,
          c.column_name AS columnName, 
          c.is_primary AS isPrimary
        FROM db_table t
        JOIN db_column c ON t.id = c.table_id
        WHERE t.connection_id = ?
        ORDER BY t.id, c.id
      `;

      const results = await transactionalEntityManager.query<
        {
          tableId: number;
          tableName: string;
          columnId: number;
          columnName: string;
          isPrimary: boolean;
        }[]
      >(sql, [connectionId]);

      // 2. 根据列生成多对一和一对一关系
      for (const col of results) {
        if (col.columnName === 'id') continue;

        // 规则：xxx_id 字段
        if (col.columnName.endsWith('_id')) {
          const targetTableName = col.columnName.replace(/_id$/, '');

          // 匹配目标表
          const target = results.find(
            (t) =>
              t.tableName === targetTableName ||
              t.tableName === `${targetTableName}s`,
          );

          if (target) {
            const isUnique = uniqueCols.includes(
              `${col.tableName}.${col.columnName}`,
            );

            const relationType: RelationType = isUnique
              ? RelationType.ONE_TO_ONE
              : RelationType.ONE_TO_MANY;

            // 检查是否已存在相同的外键关系
            const existingFk = await transactionalEntityManager.find(
              DbLogicForeignKey,
              {
                where: {
                  sourceTableId: col.tableId,
                  sourceColumnName: col.columnName,
                  targetTableId: target.tableId,
                },
              },
            );

            if (existingFk.length === 0) {
              await transactionalEntityManager.save(DbLogicForeignKey, {
                sourceTableId: col.tableId,
                sourceTableName: col.tableName,
                sourceColumnName: col.columnName,
                targetTableId: target.tableId,
                targetTableName: target.tableName,
                targetColumnName: 'id',
                relationType,
              });
            }
          }
        }
      }

      // 3. 识别多对多关系
      // 规则：表中至少有2个 *_id 字段，且没有其他非ID字段
      const tableMap = new Map<
        string,
        { id: number; columnName: string; tableId: number; tableName: string }[]
      >();
      results.forEach((col) => {
        if (!tableMap.has(col.tableName)) {
          tableMap.set(col.tableName, []);
        }
        tableMap.get(col.tableName)!.push({
          id: col.columnId,
          columnName: col.columnName,
          tableId: col.tableId,
          tableName: col.tableName,
        });
      });

      for (const [tableName, cols] of tableMap) {
        // 只考虑至少2个 *_id 字段的表
        const fkCols = cols.filter((c) => c.columnName.endsWith('_id'));
        if (fkCols.length >= 2) {
          // 认为是多对多中间表
          console.log(`检测到多对多中间表: ${tableName}`);

          for (let i = 0; i < fkCols.length; i++) {
            for (let j = i + 1; j < fkCols.length; j++) {
              const colA = fkCols[i];
              const colB = fkCols[j];

              const targetA = results.find(
                (t) =>
                  t.tableName === colA.columnName.replace(/_id$/, '') ||
                  t.tableName === `${colA.columnName.replace(/_id$/, '')}s`,
              );
              const targetB = results.find(
                (t) =>
                  t.tableName === colB.columnName.replace(/_id$/, '') ||
                  t.tableName === `${colB.columnName.replace(/_id$/, '')}s`,
              );

              if (targetA && targetB) {
                // 检查是否已存在相同的外键关系
                const existingFk1 = await transactionalEntityManager.find(
                  DbLogicForeignKey,
                  {
                    where: {
                      sourceTableId: colA.tableId,
                      sourceColumnName: colA.columnName,
                      targetTableId: targetB.tableId,
                    },
                  },
                );

                if (existingFk1.length === 0) {
                  await transactionalEntityManager.save(DbLogicForeignKey, {
                    sourceTableId: colA.tableId,
                    sourceTableName: colA.tableName,
                    sourceColumnName: colA.columnName,
                    targetTableId: targetB.tableId,
                    targetTableName: targetB.tableName,
                    targetColumnName: 'id',
                    relationType: RelationType.MANY_TO_MANY,
                  });
                }

                const existingFk2 = await transactionalEntityManager.find(
                  DbLogicForeignKey,
                  {
                    where: {
                      sourceTableId: colB.tableId,
                      sourceColumnName: colB.columnName,
                      targetTableId: targetA.tableId,
                    },
                  },
                );

                if (existingFk2.length === 0) {
                  await transactionalEntityManager.save(DbLogicForeignKey, {
                    sourceTableId: colB.tableId,
                    sourceTableName: colB.tableName,
                    sourceColumnName: colB.columnName,
                    targetTableId: targetA.tableId,
                    targetTableName: targetA.tableName,
                    targetColumnName: 'id',
                    relationType: RelationType.MANY_TO_MANY,
                  });
                }
              }
            }
          }
        }
      }
    });
  }

  async generateDatabaseMetadata(
    generateDatabaseMetadataDto: GenerateDatabaseMetadataDto,
  ) {
    const {
      connectionId,
      tables: tableInfos,
      uniqueCols,
    } = generateDatabaseMetadataDto;

    // 输入验证 - 防止恶意数据
    if (!connectionId || connectionId <= 0) {
      throw new Error('Invalid connection ID');
    }

    if (!tableInfos || tableInfos.length === 0) {
      throw new Error('No tables provided');
    }

    const connection = await this.findConnectionById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    // 使用事务确保数据一致性
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const allColumns: Partial<DbColumn>[] = [];

      // 批量插入表
      for (const table of tableInfos) {
        // 输入验证和清理
        if (!table.tableName || table.tableName.trim().length === 0) {
          throw new Error('Table name is required');
        }

        // 验证表名格式（只允许字母、数字、下划线）
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table.tableName.trim())) {
          throw new Error(`Invalid table name: ${table.tableName}`);
        }

        const dbTable = await transactionalEntityManager.save(DbTable, {
          connectionId,
          tableName: table.tableName.trim(),
          tableComment: table.tableComment?.trim() || '',
          primaryKey: table.primaryKey?.trim() || '',
        });

        // 收集所有列数据
        for (const column of table.columns) {
          // 验证列名
          if (!column.columnName || column.columnName.trim().length === 0) {
            throw new Error('Column name is required');
          }

          // 验证列名格式
          if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.columnName.trim())) {
            throw new Error(`Invalid column name: ${column.columnName}`);
          }

          // 验证数据类型
          if (!column.dataType || column.dataType.trim().length === 0) {
            throw new Error('Column data type is required');
          }

          const isForeignKey = column.columnName.endsWith('_id');

          allColumns.push({
            tableId: dbTable.id,
            columnName: column.columnName.trim(),
            dataType: column.dataType.trim(),
            isNullable: Boolean(column.isNullable),
            isPrimary: Boolean(column.isPrimary),
            columnComment: column.columnComment?.trim() || '',
            isForeignKey,
          });
        }
      }

      // 使用原生SQL逐个插入列，确保参数顺序正确
      for (const columnData of allColumns) {
        const sql = `
          INSERT INTO db_column (table_id, column_name, data_type, is_nullable, is_primary, column_comment, is_foreign_key)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const parameters = [
          columnData.tableId,
          columnData.columnName,
          columnData.dataType,
          columnData.isNullable ? 1 : 0,
          columnData.isPrimary ? 1 : 0,
          columnData.columnComment || '',
          columnData.isForeignKey ? 1 : 0,
        ];

        await transactionalEntityManager.query(sql, parameters);
      }
    });

    await this.generateLogicForeignKeys(connectionId, uniqueCols);

    const tablesWithColumns = await this.getTablesWithColumns(connectionId);

    const foreignKeys =
      await this.findLogicForeignKeysByConnectionId(connectionId);

    return {
      tables: tablesWithColumns,
      foreignKeys,
    };
  }
}
