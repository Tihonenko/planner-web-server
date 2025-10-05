import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDTO {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @ApiProperty()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @ApiProperty()
  password?: string;
}
