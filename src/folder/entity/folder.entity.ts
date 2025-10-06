import { TaskEntity } from '@/src/notes/entity/task.entity';
import { ApiProperty } from '@nestjs/swagger';

export class FolderEntity {
  constructor({ notes, ...data }: Partial<FolderEntity>) {
    Object.assign(this, data);

    if (notes && notes.length > 0) {
      this.notes = notes.map((notes) => new TaskEntity(notes));
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

  @ApiProperty({ type: TaskEntity, required: false })
  notes?: TaskEntity[];
}
