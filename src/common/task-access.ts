import { Prisma } from '@prisma/client';

export const taskReadableWhere = (
  userId: string,
  taskId?: string,
): Prisma.TaskWhereInput => ({
  ...(taskId ? { id: taskId } : {}),
  OR: [
    { userId },
    {
      folder: {
        shares: {
          some: { userId },
        },
      },
    },
  ],
});

export const taskOwnedWhere = (
  userId: string,
  taskId?: string,
): Prisma.TaskWhereInput => ({
  userId,
  ...(taskId ? { id: taskId } : {}),
});

export const folderReadableWhere = (
  userId: string,
  folderId?: string,
): Prisma.FolderWhereInput => ({
  ...(folderId ? { id: folderId } : {}),
  OR: [{ userId }, { shares: { some: { userId } } }],
});

export const folderOwnedWhere = (
  userId: string,
  folderId?: string,
): Prisma.FolderWhereInput => ({
  userId,
  ...(folderId ? { id: folderId } : {}),
});
