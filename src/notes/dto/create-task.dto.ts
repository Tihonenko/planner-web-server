import { Priority, Status } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateSubTaskDto } from './create-subtask.dto';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SubTaskEntity } from '../entity/subtask.entity';

export class CreateTaskDto {
  @IsString()
  @MinLength(2)
  @ApiProperty()
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, nullable: true })
  content?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: false })
  isDone?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: false })
  isShared?: boolean = false;

  @IsOptional()
  @IsEnum(Status)
  @ApiProperty({ enum: Status, default: Status.Inbox })
  status: Status;

  @IsOptional()
  @IsEnum(Priority)
  @ApiProperty({ enum: Priority, default: Priority.Low })
  priority: Priority;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false, nullable: true })
  dateTimeStart?: Date | null;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ required: false, nullable: true })
  dateTimeEnd?: Date | null;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, nullable: true, default: null })
  folderId?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubTaskDto)
  @ApiProperty({ required: false, type: SubTaskEntity })
  subtasks?: CreateSubTaskDto[];
}
