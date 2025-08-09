import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
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
  @Type(() => Number)
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
