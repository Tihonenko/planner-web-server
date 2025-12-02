import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { AdminRepository } from './admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepo: AdminRepository) { }

  create(createAdminDto: CreateAdminDto) {
    return 'This action adds a new admin';
  }

  async updateActive(id: string, updateAdminDto: UpdateAdminDto) {

    const user = await this.adminRepo.updateActive(id, updateAdminDto.isActive);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }
}
