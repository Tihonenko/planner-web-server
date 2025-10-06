import {
  BadRequestException,
  HttpCode,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotesRepository } from './notes.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { Priority, Status } from '@prisma/client';
import { TaskEntity } from './entity/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class NotesService {
  constructor(private readonly notesRepo: NotesRepository) {}

  async getFullNotes(userId: string) {
    const tasksData = await this.notesRepo.getTasks(userId);

    const tasks = tasksData.map((task) => new TaskEntity(task));

    return tasks;
  }

  async getNotesById(userId: string, idNotes: string) {
    const tasks = await this.notesRepo.findById(userId, idNotes);

    if (!tasks) throw new NotFoundException('Task Not Found');

    return new TaskEntity(tasks);
  }

  async create(userId, dto: CreateTaskDto) {
    const newTask = await this.notesRepo.createTask({
      userId,
      ...dto,
      isDone: false,
      isShared: false,
      status: Status.Inbox,
      priority: Priority.Low,
    });
    return new TaskEntity(newTask);
  }

  async updateTask(userId: string, id: string, dto: UpdateTaskDto) {
    const task = await this.notesRepo.findById(userId, id);

    if (!task) throw new BadRequestException('Task Not Found');

    const updateTask = await this.notesRepo.update(userId, id, dto);

    return new TaskEntity(updateTask);
  }

  async delete(userId: string, id: string) {
    const task = await this.notesRepo.findById(userId, id);

    if (!task) throw new BadRequestException('Task Not Found');

    await this.notesRepo.deleteTask(userId, id);

    return;
  }
}
