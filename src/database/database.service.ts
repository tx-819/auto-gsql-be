import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DbConnection, DbTable, DbColumn, DbLogicForeignKey } from './entities';

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
    await this.dbConnectionRepository.delete(id);
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
}
