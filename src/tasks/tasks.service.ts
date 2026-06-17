import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { Priority } from '@prisma/client';
import { TaskEntity } from './entity/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';
import { HttpMessages } from '@src/common/i18n/http-messages';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepo: TasksRepository) {}

  private toTaskEntity(
    task: Awaited<ReturnType<TasksRepository['getTasks']>>[number],
    currentUserId: string,
  ) {
    const isOwner = task.userId === currentUserId;
    const ownerName =
      !isOwner && task.user
        ? task.user.name || task.user.email
        : null;

    return new TaskEntity({
      ...task,
      isOwner,
      canEdit: isOwner,
      ownerName,
    });
  }

  async getFullNotes(userId: string) {
    const tasksData = await this.tasksRepo.getTasks(userId);

    return tasksData.map((task) => this.toTaskEntity(task, userId));
  }

  async getNotesById(userId: string, idNotes: string) {
    const task = await this.tasksRepo.findByIdAccessible(userId, idNotes);

    if (!task) throw new NotFoundException(HttpMessages.taskNotFound);

    return this.toTaskEntity(task, userId);
  }

  async create(userId: string, dto: CreateTaskDto) {
    if (dto.dateTimeStart && dto.dateTimeEnd) {
      const startDate = new Date(dto.dateTimeStart);
      const endDate = new Date(dto.dateTimeEnd);
      if (endDate < startDate) {
        throw new BadRequestException(
          'Дата окончания не может быть раньше даты начала',
        );
      }
    }

    const newTask = await this.tasksRepo.createTask({
      userId,
      ...dto,
      isDone: false,
      isShared: false,
      priority: dto.priority ?? Priority.Low,
    });

    return this.toTaskEntity(newTask, userId);
  }

  async updateTask(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.tasksRepo.findByIdOwned(userId, id);

    if (!task) {
      throw new ForbiddenException('Нет прав на редактирование задачи');
    }

    const dateTimeStart =
      dto.dateTimeStart !== undefined ? dto.dateTimeStart : task.dateTimeStart;
    const dateTimeEnd =
      dto.dateTimeEnd !== undefined ? dto.dateTimeEnd : task.dateTimeEnd;

    if (dateTimeStart && dateTimeEnd) {
      const startDate = new Date(dateTimeStart);
      const endDate = new Date(dateTimeEnd);
      if (endDate < startDate) {
        throw new BadRequestException(
          'Дата окончания не может быть раньше даты начала',
        );
      }
    }

    const updateTask = await this.tasksRepo.update(userId, id, dto);

    return this.toTaskEntity(updateTask, userId);
  }

  async updateIsDone(userId: string, id: string, isDone: boolean) {
    const task = await this.tasksRepo.findByIdOwned(userId, id);

    if (!task) {
      throw new ForbiddenException('Нет прав на изменение задачи');
    }

    if (isDone !== true && isDone !== false) {
      throw new BadRequestException(HttpMessages.isDoneMustBeBool);
    }

    const updateTask = await this.tasksRepo.updateIsDone(userId, id, isDone);

    return this.toTaskEntity(updateTask, userId);
  }

  async delete(userId: string, id: string) {
    const task = await this.tasksRepo.findByIdOwned(userId, id);

    if (!task) {
      throw new ForbiddenException('Нет прав на удаление задачи');
    }

    await this.tasksRepo.deleteTask(userId, id);
  }
}
