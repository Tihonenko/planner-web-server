import { ApiProperty } from '@nestjs/swagger';

export class FolderShareUserEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false, nullable: true })
  name: string | null;
}

export class FolderShareEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  folderId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: FolderShareUserEntity })
  user: FolderShareUserEntity;
}
