import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSubTaskDto } from './dto/create-subtask.dto';

@Injectable()
export class TasksRepository {
  constructor(private prisma: PrismaService) {}

  async getTasks(userId: string) {
    return await this.prisma.task.findMany({
      where: { userId },
      include: { subtasks: true },
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
      include: { subtasks: true },
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
    });
  }

  async findById(userId: string, id: string) {
    return await this.prisma.task.findUnique({
      where: { userId, id },
      include: {
        subtasks: true,
      },
    });
  }

  async findByTitle(title: string) {
    return await this.prisma.task.findMany({ where: { title } });
  }

  async deleteTask(userId: string, id: string) {
    return await this.prisma.task.delete({ where: { userId, id } });
  }
}
