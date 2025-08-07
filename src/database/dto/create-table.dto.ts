import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateTableDto {
  @IsNumber()
  connectionId: number;

  @IsString()
  tableName: string;

  @IsString()
  @IsOptional()
  primaryKey?: string;

  @IsString()
  @IsOptional()
  tableComment?: string;
}
