import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { DbType } from '../entities/db-connection.entity';

export class CreateConnectionDto {
  @IsString()
  name: string;

  @IsEnum(DbType)
  @IsOptional()
  dbType?: DbType;

  @IsString()
  host: string;

  @IsNumber()
  port: number;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  databaseName: string;
}
