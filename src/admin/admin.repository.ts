import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(private prisma: PrismaService) { }

  async updateActive(id: string, active: boolean) {

    return await this.prisma.user.update({
      where: { id }, data: {
        isActive: active
      }
    });
  }
}
