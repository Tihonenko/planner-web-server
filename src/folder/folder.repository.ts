import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@src/prisma/prisma.service';

@Injectable()
export class FolderRepository {
  constructor(private prisma: PrismaService) {}

  async getFolders(userId: string) {
    return await this.prisma.folder.findMany({
      where: { userId },
    });
  }

  async getFolderById(userId: string, id: string) {
    return await this.prisma.folder.findFirst({
      where: { userId, id },
      include: {
        tasks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async createFolder(data: Prisma.FolderUncheckedCreateWithoutTasksInput) {
    return await this.prisma.folder.create({ data });
  }

  async updateFolder(
    userId: string,
    id: string,
    data: Prisma.FolderUncheckedUpdateWithoutTasksInput,
  ) {
    return await this.prisma.folder.update({
      where: {
        userId,
        id,
      },
      data,
    });
  }

  async deleteFolder(userId: string, id: string) {
    return await this.prisma.folder.delete({
      where: {
        userId,
        id,
      },
    });
  }
}
