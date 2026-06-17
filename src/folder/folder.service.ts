import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ShareFolderDto } from './dto/share-folder.dto';
import { FolderRepository } from './folder.repository';
import { FolderEntity } from './entity/folder.entity';
import { FolderShareEntity } from './entity/folder-share.entity';
import { HttpMessages } from '@src/common/i18n/http-messages';

@Injectable()
export class FolderService {
  constructor(private readonly folderRepo: FolderRepository) {}

  async findFolders(userId: string) {
    const [ownedFolders, sharedFolders] = await Promise.all([
      this.folderRepo.getOwnedFolders(userId),
      this.folderRepo.getSharedFolders(userId),
    ]);

    const owned = ownedFolders.map(
      (folder) =>
        new FolderEntity({
          ...folder,
          isOwner: true,
          sharedWithMe: false,
        }),
    );

    const shared = sharedFolders.map((folder) => {
      const ownerName = folder.user.name || folder.user.email;
      return new FolderEntity({
        ...folder,
        isOwner: false,
        sharedWithMe: true,
        ownerName,
      });
    });

    return [...owned, ...shared];
  }

  async findFolder(userId: string, id: string) {
    const folderData = await this.folderRepo.getReadableFolder(userId, id);

    if (!folderData) throw new NotFoundException(HttpMessages.folderNotFound);

    const isOwner = folderData.userId === userId;
    const ownerName =
      !isOwner && folderData.user
        ? folderData.user.name || folderData.user.email
        : null;

    return new FolderEntity({
      ...folderData,
      isOwner,
      sharedWithMe: !isOwner,
      ownerName,
    });
  }

  async create(userId: string, createFolderDto: CreateFolderDto) {
    const folder = await this.folderRepo.createFolder({
      userId,
      ...createFolderDto,
    });

    if (!folder) {
      throw new BadRequestException(HttpMessages.folderNotCreated);
    }

    return new FolderEntity({
      ...folder,
      isOwner: true,
      sharedWithMe: false,
    });
  }

  async updateFolder(userId: string, id: string, dto: UpdateFolderDto) {
    const folder = await this.folderRepo.getOwnedFolder(userId, id);

    if (!folder) {
      throw new NotFoundException(HttpMessages.folderNotFoundForUpdate);
    }

    const updateFolder = await this.folderRepo.updateFolder(userId, id, dto);

    return new FolderEntity({
      ...updateFolder,
      isOwner: true,
      sharedWithMe: false,
    });
  }

  async delete(userId: string, id: string) {
    const folder = await this.folderRepo.deleteFolder(userId, id);

    if (!folder) {
      throw new NotFoundException(HttpMessages.folderNotFoundForDeletion);
    }
  }

  async shareFolder(userId: string, folderId: string, dto: ShareFolderDto) {
    const folder = await this.folderRepo.getOwnedFolder(userId, folderId);

    if (!folder) {
      throw new NotFoundException(HttpMessages.folderNotFound);
    }

    const email = dto.email.trim().toLowerCase();
    const targetUser = await this.folderRepo.findUserByEmail(email);

    if (!targetUser) {
      throw new BadRequestException('Пользователь с таким email не найден');
    }

    if (targetUser.id === userId) {
      throw new BadRequestException('Нельзя поделиться папкой с самим собой');
    }

    const existing = await this.folderRepo.hasShare(folderId, targetUser.id);
    if (existing) {
      throw new BadRequestException('Папка уже доступна этому пользователю');
    }

    await this.folderRepo.updateFolder(userId, folderId, { shared: true });

    const share = await this.folderRepo.createShare(
      folderId,
      targetUser.id,
      userId,
    );

    return {
      id: share.id,
      folderId: share.folderId,
      userId: share.userId,
      createdAt: share.createdAt,
      user: share.user,
    } as FolderShareEntity;
  }

  async getFolderShares(userId: string, folderId: string) {
    const folder = await this.folderRepo.getOwnedFolder(userId, folderId);

    if (!folder) {
      throw new NotFoundException(HttpMessages.folderNotFound);
    }

    const shares = await this.folderRepo.getShares(folderId);

    return shares.map((share) => ({
      id: share.id,
      folderId: share.folderId,
      userId: share.userId,
      createdAt: share.createdAt,
      user: share.user,
    }));
  }

  async revokeShare(userId: string, folderId: string, sharedUserId: string) {
    const folder = await this.folderRepo.getOwnedFolder(userId, folderId);

    if (!folder) {
      throw new NotFoundException(HttpMessages.folderNotFound);
    }

    try {
      await this.folderRepo.deleteShare(folderId, sharedUserId);
    } catch {
      throw new NotFoundException('Доступ не найден');
    }

    const remaining = await this.folderRepo.getShares(folderId);
    if (remaining.length === 0) {
      await this.folderRepo.updateFolder(userId, folderId, { shared: false });
    }
  }
}
