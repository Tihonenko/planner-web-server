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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import {
  JwtAuthGuard,
  JwtPayloadAuth,
} from '@src/common/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { TaskEntity } from './entity/task.entity';
import { UpdateTaskDto } from './dto/update-task.dto';
import { IsBoolean } from 'class-validator';

interface TaskReq extends Request {
  user: JwtPayloadAuth;
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOkResponse({ type: TaskEntity })
  async getFullTask(@Req() req: TaskReq) {
    return await this.tasksService.getFullNotes(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOkResponse({ type: TaskEntity })
  async getTaskById(@Req() req: TaskReq, @Param('id') id: string) {
    return await this.tasksService.getNotesById(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOkResponse({ type: TaskEntity })
  async createTask(@Req() req: TaskReq, @Body() dto: CreateTaskDto) {
    return await this.tasksService.create(req.user.id, dto);
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
    return await this.tasksService.updateTask(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/isDone')
  @ApiBearerAuth()
  @ApiOkResponse()
  async isDone(
    @Req() req: TaskReq,
    @Param('id') id: string,
    @Body()
    body: {
      isDone: boolean;
    },
  ) {
    return await this.tasksService.updateIsDone(req.user.id, id, body.isDone);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOkResponse({ type: TaskEntity })
  async deleteTask(@Req() req: TaskReq, @Param('id') id: string) {
    await this.tasksService.delete(req.user.id, id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Task Deleted',
    };
  }
}
