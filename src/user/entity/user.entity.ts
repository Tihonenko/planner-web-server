import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserEntity implements User {
  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  login: string;

  @Exclude()
  password: string;

  @ApiProperty({ enum: Role, default: Role.USER })
  @Exclude()
  role: Role;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
