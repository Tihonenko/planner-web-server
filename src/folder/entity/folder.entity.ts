import { TaskEntity } from '@/src/tasks/entity/task.entity';
import { ApiProperty } from '@nestjs/swagger';

export class FolderEntity {
  constructor({ tasks, ...data }: Partial<FolderEntity>) {
    Object.assign(this, data);

    if (tasks && tasks.length > 0) {
      this.tasks = tasks.map((task) => new TaskEntity(task));
    }
  }

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false, default: true })
  isOwner?: boolean;

  @ApiProperty({ required: false, default: false })
  sharedWithMe?: boolean;

  @ApiProperty({ required: false, nullable: true })
  ownerName?: string | null;

  @ApiProperty({ required: false, default: false })
  shared?: boolean;

  @ApiProperty({ type: TaskEntity, required: false })
  tasks?: TaskEntity[];
}
