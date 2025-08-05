import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DbConnection, DbTable, DbColumn, DbLogicForeignKey } from './entities';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DbConnection,
      DbTable,
      DbColumn,
      DbLogicForeignKey,
    ]),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [TypeOrmModule, DatabaseService],
})
export class DatabaseModule {}
