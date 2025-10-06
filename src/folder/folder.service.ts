import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderRepository } from './folder.repository';
import { FolderEntity } from './entity/folder.entity';

@Injectable()
export class FolderService {
  constructor(private readonly folderRepo: FolderRepository) {}

  async findFolders(userId: string) {
    const foldersData = await this.folderRepo.getFolders(userId);

    const folders = foldersData.map((folder) => new FolderEntity(folder));

    return folders;
  }

  async findFolder(userId: string, id: string) {
    const folderData = await this.folderRepo.getFolderById(userId, id);

    if (!folderData) throw new NotFoundException('Folder Not Found');

    return new FolderEntity(folderData);
  }

  async create(userId: string, createFolderDto: CreateFolderDto) {
    const folder = await this.folderRepo.createFolder({
      userId,
      ...createFolderDto,
    });

    if (!folder) {
      throw new BadRequestException('Folder Not Created');
    }

    return new FolderEntity(folder);
  }

  async updateFolder(userId: string, id: string, dto: UpdateFolderDto) {
    const folder = await this.folderRepo.getFolderById(userId, id);

    if (!folder) {
      throw new NotFoundException('Folder Not Found for update');
    }

    const updateFolder = await this.folderRepo.updateFolder(userId, id, dto);

    return new FolderEntity(updateFolder);
  }

  async delete(userId: string, id: string) {
    const folder = await this.folderRepo.deleteFolder(userId, id);

    if (!folder) {
      throw new NotFoundException('Folder Not Found for deletion');
    }

    return;
  }
}
