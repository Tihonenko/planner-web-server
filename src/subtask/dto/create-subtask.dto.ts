import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSubtaskDto {
  @IsString()
  @MinLength(2)
  @ApiProperty()
  title: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ default: false })
  isDone: boolean = false;

  @IsString()
  @ApiProperty()
  taskId: string;
}
