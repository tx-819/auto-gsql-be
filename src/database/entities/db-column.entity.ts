import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('db_column')
export class DbColumn {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'table_id', type: 'bigint' })
  tableId: number;

  @Column({ name: 'column_name', type: 'varchar', length: 100 })
  columnName: string;

  @Column({ name: 'data_type', type: 'varchar', length: 50 })
  dataType: string;

  @Column({ name: 'is_nullable', type: 'boolean', nullable: true })
  isNullable: boolean;

  @Column({ name: 'is_primary', type: 'boolean', nullable: true })
  isPrimary: boolean;

  @Column({ name: 'is_foreign_key', type: 'boolean', nullable: true })
  isForeignKey: boolean;

  @Column({
    name: 'column_comment',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  columnComment: string;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;
}
