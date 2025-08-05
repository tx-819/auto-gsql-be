import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum RelationType {
  ONE_TO_ONE = 'one-to-one',
  ONE_TO_MANY = 'one-to-many',
  MANY_TO_MANY = 'many-to-many',
}

@Entity('db_logic_foreign_key')
export class DbLogicForeignKey {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'source_table_id', type: 'bigint' })
  sourceTableId: number;

  @Column({ name: 'source_column_name', type: 'varchar', length: 100 })
  sourceColumnName: string;

  @Column({ name: 'target_table_id', type: 'bigint' })
  targetTableId: number;

  @Column({ name: 'target_column_name', type: 'varchar', length: 100 })
  targetColumnName: string;

  @Column({
    name: 'relation_type',
    type: 'enum',
    enum: RelationType,
    default: RelationType.ONE_TO_MANY,
  })
  relationType: RelationType;
}
