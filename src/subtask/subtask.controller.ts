import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubtaskService } from './subtask.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';
import {
  JwtAuthGuard,
  JwtPayloadAuth,
} from '@src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { SubTaskEntity } from '@src/tasks/entity/subtask.entity';

interface TaskReq extends Request {
  user: JwtPayloadAuth;
}

@Controller('subtasks')
export class SubtaskController {
  constructor(private readonly subtaskService: SubtaskService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOkResponse({ type: SubTaskEntity })
  create(@Req() req: TaskReq, @Body() createSubtaskDto: CreateSubtaskDto) {
    return this.subtaskService.create(req.user.id, createSubtaskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('task/:taskId')
  @ApiBearerAuth()
  @ApiOkResponse({ type: SubTaskEntity, isArray: true })
  findAll(@Req() req: TaskReq, @Param('taskId') taskId: string) {
    return this.subtaskService.findAll(req.user.id, taskId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: SubTaskEntity })
  findOne(@Req() req: TaskReq, @Param('id') id: string) {
    return this.subtaskService.findOne(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: SubTaskEntity })
  update(
    @Req() req: TaskReq,
    @Param('id') id: string,
    @Body() updateSubtaskDto: UpdateSubtaskDto,
  ) {
    return this.subtaskService.update(req.user.id, id, updateSubtaskDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  remove(@Req() req: TaskReq, @Param('id') id: string) {
    return this.subtaskService.remove(req.user.id, id);
  }
}
