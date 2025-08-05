import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { RelationType } from '../entities/db-logic-foreign-key.entity';

export class CreateForeignKeyDto {
  @IsNumber()
  sourceTableId: number;

  @IsString()
  sourceColumnName: string;

  @IsNumber()
  targetTableId: number;

  @IsString()
  targetColumnName: string;

  @IsEnum(RelationType)
  @IsOptional()
  relationType?: RelationType;
}
