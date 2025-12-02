import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { Priority } from '@prisma/client';
import { TaskEntity } from './entity/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';
import { IsBoolean, isBoolean } from 'class-validator';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepo: TasksRepository) {}

  async getFullNotes(userId: string) {
    const tasksData = await this.tasksRepo.getTasks(userId);

    const tasks = tasksData.map((task) => new TaskEntity(task));

    return tasks;
  }

  async getNotesById(userId: string, idNotes: string) {
    const tasks = await this.tasksRepo.findById(userId, idNotes);

    if (!tasks) throw new NotFoundException('Task Not Found');

    return new TaskEntity(tasks);
  }

  async create(userId, dto: CreateTaskDto) {
    const newTask = await this.tasksRepo.createTask({
      userId,
      ...dto,
      isDone: false,
      isShared: false,
      priority: Priority.Low,
    });
    return new TaskEntity(newTask);
  }

  async updateTask(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.tasksRepo.findById(userId, id);

    if (!task) throw new BadRequestException('Task Not Found');

    const updateTask = await this.tasksRepo.update(userId, id, dto);

    return new TaskEntity(updateTask);
  }

  async updateIsDone(userId: string, id: string, isDone: boolean) {
    const task = await this.tasksRepo.findById(userId, id);

    if (!task) throw new NotFoundException('Task Not Found');

    if (isDone !== true && isDone !== false) {
      throw new BadRequestException('is done must be bool');
    }

    const updateTask = await this.tasksRepo.updateIsDone(userId, id, isDone);

    return new TaskEntity(updateTask);
  }

  async delete(userId: string, id: string) {
    const task = await this.tasksRepo.findById(userId, id);

    if (!task) throw new BadRequestException('Task Not Found');

    await this.tasksRepo.deleteTask(userId, id);

    return;
  }
}
