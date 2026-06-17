import { Module } from '@nestjs/common';
import { SubtaskService } from './subtask.service';
import { SubtaskController } from './subtask.controller';
import { SubtaskRepository } from './subtask.repository';

@Module({
  controllers: [SubtaskController],
  providers: [SubtaskService, SubtaskRepository],
  exports: [SubtaskService],
})
export class SubtaskModule {}
