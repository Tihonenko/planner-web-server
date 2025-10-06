import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import {
  JwtAuthGuard,
  JwtPayloadAuth,
} from '@src/common/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { GetTaskDto } from './dto/get-task.dto';
import { TaskEntity } from './entity/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';

interface TaskReq extends Request {
  user: JwtPayloadAuth;
}

@Controller('tasks')
export class NotesController {
  constructor(private readonly NotesService: NotesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOkResponse({ type: TaskEntity })
  async getFullTask(@Req() req: TaskReq) {
    return await this.NotesService.getFullNotes(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: TaskEntity })
  async getTaskById(@Req() req: TaskReq, @Param('id') id: string) {
    return await this.NotesService.getNotesById(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOkResponse({ type: TaskEntity })
  async createTask(@Req() req: TaskReq, @Body() dto: CreateTaskDto) {
    return await this.NotesService.create(req.user.id, dto);
  }
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: TaskEntity })
  async updateTask(
    @Req() req: TaskReq,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return await this.NotesService.updateTask(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: TaskEntity })
  async deleteTask(@Req() req: TaskReq, @Param('id') id: string) {
    await this.NotesService.delete(req.user.id, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Task Deleted',
    };
  }
}
