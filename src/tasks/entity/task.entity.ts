import { Priority, SubTask, Task } from '@prisma/client';
import { SubTaskEntity } from './subtask.entity';
import { ApiProperty } from '@nestjs/swagger';

export class TaskEntity implements Task {
  constructor({ subtasks, ...data }: Partial<TaskEntity>) {
    Object.assign(this, data);

    if (subtasks && subtasks.length > 0) {
      this.subtasks = subtasks.map((subtasks) => new SubTaskEntity(subtasks));
    }
  }

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, nullable: true })
  content: string | null;

  @ApiProperty({ required: false, default: false })
  isDone: boolean = false;

  @ApiProperty({ required: false, default: false })
  isShared: boolean = false;

  @ApiProperty({ enum: Priority, default: Priority.Low })
  priority: Priority;

  @ApiProperty({ required: false, nullable: true })
  dateTimeStart: Date | null;

  @ApiProperty({ required: false, nullable: true })
  dateTimeEnd: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false, nullable: true, default: null })
  folderId: string | null;

  @ApiProperty({ required: false, type: SubTaskEntity })
  subtasks?: SubTaskEntity[];
}
