import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

export class GetUserDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  login: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;

  constructor(user: User) {
    Object.assign(this, {
      id: user.id,
      name: user.name,
      login: user.login,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
