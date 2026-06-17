import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ConfirmPasswordChangeDto {
  @IsString()
  @Length(6, 6)
  @ApiProperty({ example: '123456' })
  code: string;
}
