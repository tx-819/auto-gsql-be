import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateColumnDto {
  @IsNumber()
  tableId: number;

  @IsString()
  columnName: string;

  @IsString()
  dataType: string;

  @IsBoolean()
  @IsOptional()
  isNullable?: boolean;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  columnComment?: string;
}
