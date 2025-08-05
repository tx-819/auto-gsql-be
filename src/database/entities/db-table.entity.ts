import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('db_table')
export class DbTable {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'connection_id', type: 'bigint' })
  connectionId: number;

  @Column({ name: 'table_name', type: 'varchar', length: 100 })
  tableName: string;

  @Column({
    name: 'table_comment',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  tableComment: string;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;
}
