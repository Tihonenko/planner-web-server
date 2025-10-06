import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSubTaskDto } from './dto/create-subtask.dto';

@Injectable()
export class NotesRepository {
  constructor(private prisma: PrismaService) {}

  async getTasks(userId: string) {
    return await this.prisma.note.findMany({
      where: { userId },
      include: { subtasks: true },
    });
  }

  async createTask(
    data: Prisma.NoteUncheckedCreateInput & { subtasks?: CreateSubTaskDto[] },
  ) {
    const { subtasks, ...noteData } = data;

    return await this.prisma.note.create({
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
    data: Prisma.NoteUncheckedUpdateManyInput,
  ) {
    return await this.prisma.note.update({
      where: {
        userId,
        id,
      },
      data,
    });
  }

  async findById(userId: string, id: string) {
    return await this.prisma.note.findUnique({
      where: { userId, id },
      include: {
        subtasks: true,
      },
    });
  }

  async findByTitle(title: string) {
    return await this.prisma.note.findMany({ where: { title } });
  }

  async deleteTask(userId: string, id: string) {
    return await this.prisma.note.delete({ where: { userId, id } });
  }
}
