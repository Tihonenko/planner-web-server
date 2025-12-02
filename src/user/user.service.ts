import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UpdateUserDTO } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { User } from '@prisma/client';
import { GetUserDto } from './dto/get-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    const users: User[] = await this.userRepo.findAll();

    return users;
  }

  async getById(id: string): Promise<GetUserDto> {
    const user = await this.userRepo.findById(id);

    if (!user) throw new NotFoundException('User Not Found');

    if (user.isActive === false) {
      throw new ForbiddenException('Your account has been blocked');
    }

    return new GetUserDto(user);
  }

  async update(id: string, dto: UpdateUserDTO) {
    const data: UpdateUserDTO = { ...dto };

    if (dto.password) {
      // TODO: ADD CHECK OLD PASSWORD

      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updateUser = await this.userRepo.update(id, data);

    if (!updateUser) throw new BadRequestException('User Not Updatet');

    return new GetUserDto(updateUser);
  }

  async delete(id: string) {
    return new GetUserDto(await this.userRepo.delete(id));
  }
}
