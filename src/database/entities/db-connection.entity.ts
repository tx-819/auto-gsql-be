import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum DbType {
  MYSQL = 'mysql',
  POSTGRES = 'postgres',
}

@Entity('db_connection')
export class DbConnection {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: DbType,
    default: DbType.MYSQL,
  })
  dbType: DbType;

  @Column({ type: 'varchar', length: 100 })
  host: string;

  @Column({ type: 'int' })
  port: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  password: string;

  @Column({ name: 'database_name', type: 'varchar', length: 100 })
  databaseName: string;

  @CreateDateColumn({ name: 'create_time' })
  createTime: Date;
}
