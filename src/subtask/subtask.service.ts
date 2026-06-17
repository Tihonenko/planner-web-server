import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import { SubtaskRepository } from './subtask.repository';
import { SubTaskEntity } from '@src/tasks/entity/subtask.entity';
import { HttpMessages } from '@src/common/i18n/http-messages';

@Injectable()
export class SubtaskService {
  constructor(private readonly subtaskRepo: SubtaskRepository) {}

  async create(userId: string, createSubtaskDto: CreateSubtaskDto) {
    const task = await this.subtaskRepo.findTaskForUser(
      userId,
      createSubtaskDto.taskId,
    );

    if (!task) {
      throw new NotFoundException(HttpMessages.taskNotFound);
    }

    const subtask = await this.subtaskRepo.createSubtask({
      title: createSubtaskDto.title,
      isDone: createSubtaskDto.isDone ?? false,
      task: { connect: { id: createSubtaskDto.taskId } },
    });

    return new SubTaskEntity(subtask);
  }

  async findAll(userId: string, taskId: string) {
    const task = await this.subtaskRepo.findReadableTask(userId, taskId);
    if (!task) {
      throw new NotFoundException(HttpMessages.taskNotFound);
    }

    const subtasks = await this.subtaskRepo.findAllByTaskId(userId, taskId);

    return subtasks.map((subtask) => new SubTaskEntity(subtask));
  }

  async findOne(userId: string, id: string) {
    const subtask = await this.subtaskRepo.findById(userId, id);

    if (!subtask) {
      throw new NotFoundException(HttpMessages.subtaskNotFound);
    }

    return new SubTaskEntity(subtask);
  }

  async update(userId: string, id: string, updateSubtaskDto: UpdateSubtaskDto) {
    const subtask = await this.subtaskRepo.findByIdOwned(userId, id);

    if (!subtask) {
      throw new ForbiddenException('Нет прав на редактирование подзадачи');
    }

    if (updateSubtaskDto.taskId !== undefined) {
      const task = await this.subtaskRepo.findTaskForUser(
        userId,
        updateSubtaskDto.taskId,
      );

      if (!task) {
        throw new NotFoundException(HttpMessages.taskNotFound);
      }
    }

    const updated = await this.subtaskRepo.updateSubtask(id, updateSubtaskDto);

    return new SubTaskEntity(updated);
  }

  async remove(userId: string, id: string) {
    const subtask = await this.subtaskRepo.findByIdOwned(userId, id);

    if (!subtask) {
      throw new ForbiddenException('Нет прав на удаление подзадачи');
    }

    await this.subtaskRepo.deleteSubtask(id);
  }
}
