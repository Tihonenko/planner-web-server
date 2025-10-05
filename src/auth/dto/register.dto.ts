import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RegisterDTO {
  @IsString()
  @MinLength(2)
  @ApiProperty()
  name: string;

  @IsString()
  @MinLength(3)
  @ApiProperty()
  login: string;

  @IsString()
  @MinLength(6)
  @ApiProperty()
  password: string;
}
