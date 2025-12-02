import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsString } from 'class-validator';

export class ActiveUserDto {
  @IsEmail()
  @IsString()
  email: string;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
