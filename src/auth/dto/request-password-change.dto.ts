import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RequestPasswordChangeDto {
  @IsString()
  @MinLength(6)
  @ApiProperty({ minLength: 6 })
  password: string;
}
