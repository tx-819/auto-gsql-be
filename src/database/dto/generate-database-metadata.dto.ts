import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  ArrayMinSize,
  IsPositive,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AiConfig } from '../../chat/services/openai.service';

/**
 * 数据库列信息验证DTO
 */
class DbColumnInfoDto {
  @IsString()
  @IsNotEmpty()
  columnName: string;

  @IsString()
  @IsNotEmpty()
  dataType: string;

  @IsBoolean()
  isNullable: boolean;

  @IsBoolean()
  isPrimary: boolean;

  @IsString()
  @IsOptional()
  columnComment?: string;
}

/**
 * 数据库表信息验证DTO
 */
class DbTableInfoDto {
  @IsString()
  @IsNotEmpty()
  tableName: string;

  @IsString()
  @IsOptional()
  tableComment?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DbColumnInfoDto)
  @ArrayMinSize(1, { message: '表至少需要包含一个列' })
  columns: DbColumnInfoDto[];

  @IsString()
  @IsNotEmpty()
  primaryKey: string;
}

/**
 * 生成数据库元数据DTO
 * 用于批量创建数据库表结构
 */
export class GenerateDatabaseMetadataDto {
  /** 数据库连接ID */
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  connectionId: number;

  /** 表信息数组 */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DbTableInfoDto)
  @ArrayMinSize(1, { message: '至少需要包含一个表' })
  @IsNotEmpty()
  tables: DbTableInfoDto[];

  /** 唯一列 */
  @IsArray()
  @IsString({ each: true })
  uniqueCols: string[];

  /** AI配置 */
  @IsObject()
  @IsOptional()
  aiConfig: AiConfig | null = null;
}
