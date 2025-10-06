import { Module } from '@nestjs/common';
import { FolderService } from './folder.service';
import { FolderController } from './folder.controller';
import { FolderRepository } from './folder.repository';

@Module({
  controllers: [FolderController],
  providers: [FolderService, FolderRepository],
})
export class FolderModule {}
