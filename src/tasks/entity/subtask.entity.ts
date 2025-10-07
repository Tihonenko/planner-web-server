import { ApiProperty } from '@nestjs/swagger';
import { SubTask } from '@prisma/client';

export class SubTaskEntity implements SubTask {
  constructor({ ...data }: Partial<SubTaskEntity>) {
    Object.assign(this, data);
  }

  @ApiProperty()
  id: string;

  @ApiProperty()
  taskId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false, default: false })
  isDone: boolean = false;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
