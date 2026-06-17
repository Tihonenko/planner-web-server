import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@src/prisma/prisma.service';
import {
  taskOwnedWhere,
  taskReadableWhere,
} from '@src/common/task-access';

@Injectable()
export class SubtaskRepository {
  constructor(private prisma: PrismaService) {}

  async findTaskForUser(userId: string, taskId: string) {
    return await this.prisma.task.findFirst({
      where: taskOwnedWhere(userId, taskId),
    });
  }

  async findReadableTask(userId: string, taskId: string) {
    return await this.prisma.task.findFirst({
      where: taskReadableWhere(userId, taskId),
    });
  }

  async createSubtask(data: Prisma.SubTaskCreateInput) {
    return await this.prisma.subTask.create({ data });
  }

  async findById(userId: string, id: string) {
    return await this.prisma.subTask.findFirst({
      where: {
        id,
        task: taskReadableWhere(userId),
      },
    });
  }

  async findByIdOwned(userId: string, id: string) {
    return await this.prisma.subTask.findFirst({
      where: {
        id,
        task: taskOwnedWhere(userId),
      },
    });
  }

  async findAllByTaskId(userId: string, taskId: string) {
    return await this.prisma.subTask.findMany({
      where: {
        taskId,
        task: taskReadableWhere(userId, taskId),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateSubtask(id: string, data: Prisma.SubTaskUncheckedUpdateInput) {
    return await this.prisma.subTask.update({
      where: { id },
      data,
    });
  }

  async deleteSubtask(id: string) {
    return await this.prisma.subTask.delete({
      where: { id },
    });
  }
}
