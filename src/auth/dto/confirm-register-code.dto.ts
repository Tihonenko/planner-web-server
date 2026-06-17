import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class ConfirmRegisterCodeDto {
  @IsEmail()
  @ApiProperty()
  email: string;

  @IsString()
  @Length(6, 6)
  @ApiProperty({ example: '123456' })
  code: string;
}
