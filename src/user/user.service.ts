import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UpdateUserDTO } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { GetUserDto } from './dto/get-user.dto';
import { HttpMessages } from '@src/common/i18n/http-messages';
import { assertUserIsActive } from '@src/common/user-active';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    const users: User[] = await this.userRepo.findAll();

    return users;
  }

  async getById(id: string): Promise<GetUserDto> {
    const user = await this.userRepo.findById(id);

    if (!user) throw new NotFoundException(HttpMessages.userNotFound);

    assertUserIsActive(user.isActive);

    return new GetUserDto(user);
  }

  async update(id: string, dto: UpdateUserDTO) {
    const updateUser = await this.userRepo.update(id, dto);

    if (!updateUser) throw new BadRequestException(HttpMessages.userNotUpdated);

    return new GetUserDto(updateUser);
  }

  async delete(id: string) {
    return new GetUserDto(await this.userRepo.delete(id));
  }
}
