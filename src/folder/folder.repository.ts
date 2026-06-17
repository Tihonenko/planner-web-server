import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@src/prisma/prisma.service';
import {
  folderOwnedWhere,
  folderReadableWhere,
} from '@src/common/task-access';

@Injectable()
export class FolderRepository {
  constructor(private prisma: PrismaService) {}

  async getOwnedFolders(userId: string) {
    return await this.prisma.folder.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSharedFolders(userId: string) {
    return await this.prisma.folder.findMany({
      where: {
        shares: { some: { userId } },
        userId: { not: userId },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getReadableFolder(userId: string, id: string) {
    return await this.prisma.folder.findFirst({
      where: folderReadableWhere(userId, id),
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getOwnedFolder(userId: string, id: string) {
    return await this.prisma.folder.findFirst({
      where: folderOwnedWhere(userId, id),
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

  async findUserByEmail(email: string) {
    return await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: { id: true, email: true, name: true },
    });
  }

  async createShare(folderId: string, userId: string, sharedById: string) {
    return await this.prisma.folderShare.create({
      data: {
        folderId,
        userId,
        sharedById,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async getShares(folderId: string) {
    return await this.prisma.folderShare.findMany({
      where: { folderId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteShare(folderId: string, sharedUserId: string) {
    return await this.prisma.folderShare.delete({
      where: {
        folderId_userId: {
          folderId,
          userId: sharedUserId,
        },
      },
    });
  }

  async hasShare(folderId: string, userId: string) {
    return await this.prisma.folderShare.findUnique({
      where: {
        folderId_userId: {
          folderId,
          userId,
        },
      },
    });
  }
}
