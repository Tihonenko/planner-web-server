import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, JwtPayloadAuth } from '@src/common/guards/jwt-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

interface EventReq extends Request {
  user: JwtPayloadAuth;
}

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get()
  async getEvents(@Req() req: EventReq) {
    return this.eventsService.getMyEvents(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('invitations/pending')
  async getPendingInvitations(@Req() req: EventReq) {
    return this.eventsService.getPendingInvitations(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  async createEvent(@Req() req: EventReq, @Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  async updateEvent(
    @Req() req: EventReq,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.updateEvent(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/accept')
  async acceptInvitation(@Req() req: EventReq, @Param('id') id: string) {
    return this.eventsService.acceptInvitation(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete(':id')
  async deleteEvent(@Req() req: EventReq, @Param('id') id: string) {
    return this.eventsService.deleteEvent(req.user.id, id);
  }
}
