import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';

export class GetUserDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  updatedAt: Date;
  @ApiProperty({ enum: Role })
  role: Role;

  constructor(user: User) {
    Object.assign(this, {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role,
    });
  }
}
