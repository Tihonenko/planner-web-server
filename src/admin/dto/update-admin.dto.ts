import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAdminDto {

  @ApiProperty()
  id: string;

  @ApiProperty({ example: false, description: 'User active status (false = active, true = blocked)' })
  @IsBoolean()
  isActive: boolean;
}
