import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ShareFolderDto } from './dto/share-folder.dto';
import {
  JwtAuthGuard,
  JwtPayloadAuth,
} from '@src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { FolderEntity } from './entity/folder.entity';
import { FolderShareEntity } from './entity/folder-share.entity';

interface folderReq extends Request {
  user: JwtPayloadAuth;
}

@Controller('folder')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderEntity })
  @Post()
  async create(
    @Req() req: folderReq,
    @Body() createFolderDto: CreateFolderDto,
  ) {
    return await this.folderService.create(req.user.id, createFolderDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderEntity })
  @Get()
  async findAll(@Req() req: folderReq) {
    return await this.folderService.findFolders(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/shares')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderShareEntity, isArray: true })
  async getShares(@Req() req: folderReq, @Param('id') id: string) {
    return await this.folderService.getFolderShares(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderShareEntity })
  async share(
    @Req() req: folderReq,
    @Param('id') id: string,
    @Body() dto: ShareFolderDto,
  ) {
    return await this.folderService.shareFolder(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/share/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  async revokeShare(
    @Req() req: folderReq,
    @Param('id') id: string,
    @Param('userId') sharedUserId: string,
  ) {
    await this.folderService.revokeShare(req.user.id, id, sharedUserId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Share revoked',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderEntity })
  async findOne(@Req() req: folderReq, @Param('id') id: string) {
    return await this.folderService.findFolder(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderEntity })
  async update(
    @Req() req: folderReq,
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
  ) {
    return await this.folderService.updateFolder(
      req.user.id,
      id,
      updateFolderDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: FolderEntity })
  async delete(@Req() req: folderReq, @Param('id') id: string) {
    await this.folderService.delete(req.user.id, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Folder deleted',
    };
  }
}
