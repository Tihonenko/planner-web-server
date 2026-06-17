import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSubTaskDto } from './dto/create-subtask.dto';
import {
  taskOwnedWhere,
  taskReadableWhere,
} from '@src/common/task-access';

const taskInclude = {
  subtasks: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

@Injectable()
export class TasksRepository {
  constructor(private prisma: PrismaService) {}

  async getTasks(userId: string) {
    return await this.prisma.task.findMany({
      where: taskReadableWhere(userId),
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(
    data: Prisma.TaskUncheckedCreateInput & { subtasks?: CreateSubTaskDto[] },
  ) {
    const { subtasks, ...noteData } = data;

    return await this.prisma.task.create({
      data: {
        ...noteData,
        ...(subtasks &&
          subtasks.length > 0 && {
            subtasks: {
              createMany: {
                data: subtasks.map((subtask) => ({
                  title: subtask.title,
                  isDone: subtask.isDone,
                })),
              },
            },
          }),
      },
      include: taskInclude,
    });
  }

  async update(
    userId: string,
    id: string,
    data: Prisma.TaskUncheckedUpdateManyInput,
  ) {
    return await this.prisma.task.update({
      where: {
        userId,
        id,
      },
      data,
      include: taskInclude,
    });
  }

  async updateIsDone(userId: string, id: string, isDone: boolean) {
    return await this.prisma.task.update({
      where: {
        userId,
        id,
      },
      data: {
        isDone,
      },
      include: taskInclude,
    });
  }

  async findByIdAccessible(userId: string, id: string) {
    return await this.prisma.task.findFirst({
      where: taskReadableWhere(userId, id),
      include: taskInclude,
    });
  }

  async findByIdOwned(userId: string, id: string) {
    return await this.prisma.task.findFirst({
      where: taskOwnedWhere(userId, id),
      include: taskInclude,
    });
  }

  async findByTitle(title: string) {
    return await this.prisma.task.findMany({ where: { title } });
  }

  async deleteTask(userId: string, id: string) {
    return await this.prisma.task.delete({ where: { userId, id } });
  }
}
