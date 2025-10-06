import { PartialType } from '@nestjs/swagger';
import { TaskEntity } from '../entity/task.entity';

export class GetTaskDto extends PartialType(TaskEntity) {}
