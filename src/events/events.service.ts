import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@src/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventParticipantStatus } from '@prisma/client';
import { MailService } from '@src/auth/mail.service';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async getMyEvents(userId: string) {
    return this.prisma.event.findMany({
      where: {
        OR: [
          { organizerId: userId },
          { participants: { some: { userId, status: EventParticipantStatus.ACCEPTED } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });
  }

  async getPendingInvitations(userId: string) {
    return this.prisma.event.findMany({
      where: {
        participants: {
          some: {
            userId,
            status: EventParticipantStatus.PENDING,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
    });
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt < startsAt) {
      throw new BadRequestException('Дата окончания мероприятия не может быть раньше даты начала');
    }

    const participantEmails = Array.from(
      new Set((dto.participantEmails || []).map((email) => email.trim()).filter(Boolean)),
    );

    let invitedUsers: { id: string; email: string }[] = [];
    if (participantEmails.length > 0) {
      invitedUsers = await this.prisma.user.findMany({
        where: {
          email: { in: participantEmails },
        },
        select: {
          id: true,
          email: true,
        },
      });

      const foundEmails = new Set(invitedUsers.map((user) => user.email));
      const missingEmails = participantEmails.filter((email) => !foundEmails.has(email));
      if (missingEmails.length > 0) {
        throw new BadRequestException(`Пользователи не найдены: ${missingEmails.join(', ')}`);
      }
    }

    const invitedParticipantData = invitedUsers
      .filter((user) => user.id !== userId)
      .map((user) => ({
        userId: user.id,
      }));

    const organizer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const createdEvent = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description || null,
        location: dto.location || null,
        startsAt,
        endsAt,
        allDay: dto.allDay ?? false,
        organizerId: userId,
        folderId: dto.folderId || null,
        ...(invitedParticipantData.length > 0 && {
          participants: {
            createMany: {
              data: invitedParticipantData,
            },
          },
        }),
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const inviterName = organizer?.name || organizer?.email || 'Пользователь';
    for (const invitedUser of invitedUsers) {
      if (invitedUser.id === userId) continue;
      try {
        await this.mailService.sendEventInvite({
          email: invitedUser.email,
          inviterName,
          eventTitle: createdEvent.title,
          startsAt: createdEvent.startsAt,
          endsAt: createdEvent.endsAt,
          eventId: createdEvent.id,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to send invite to ${invitedUser.email} for event ${createdEvent.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return createdEvent;
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    const existing = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new BadRequestException('Мероприятие не найдено');
    }

    if (existing.organizerId !== userId) {
      throw new ForbiddenException('Редактировать мероприятие может только организатор');
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    if (endsAt < startsAt) {
      throw new BadRequestException('Дата окончания мероприятия не может быть раньше даты начала');
    }

    const participantEmails = Array.from(
      new Set((dto.participantEmails || []).map((email) => email.trim()).filter(Boolean)),
    );

    const existingParticipantEmails = new Set(
      existing.participants
        .map((participant) => participant.user?.email)
        .filter((email): email is string => Boolean(email)),
    );

    const newParticipantEmails = participantEmails.filter(
      (email) => !existingParticipantEmails.has(email),
    );

    let invitedUsers: { id: string; email: string }[] = [];
    if (newParticipantEmails.length > 0) {
      invitedUsers = await this.prisma.user.findMany({
        where: { email: { in: newParticipantEmails } },
        select: { id: true, email: true },
      });

      const foundEmails = new Set(invitedUsers.map((user) => user.email));
      const missingEmails = newParticipantEmails.filter((email) => !foundEmails.has(email));
      if (missingEmails.length > 0) {
        throw new BadRequestException(`Пользователи не найдены: ${missingEmails.join(', ')}`);
      }
    }

    const invitedParticipantData = invitedUsers
      .filter((user) => user.id !== userId)
      .map((user) => ({ userId: user.id }));

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.startsAt !== undefined && { startsAt }),
        ...(dto.endsAt !== undefined && { endsAt }),
        ...(dto.allDay !== undefined && { allDay: dto.allDay }),
        ...(dto.folderId !== undefined && { folderId: dto.folderId }),
        ...(invitedParticipantData.length > 0 && {
          participants: {
            createMany: { data: invitedParticipantData },
          },
        }),
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    const organizer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    const inviterName = organizer?.name || organizer?.email || 'Пользователь';

    for (const invitedUser of invitedUsers) {
      if (invitedUser.id === userId) continue;
      try {
        await this.mailService.sendEventInvite({
          email: invitedUser.email,
          inviterName,
          eventTitle: updatedEvent.title,
          startsAt: updatedEvent.startsAt,
          endsAt: updatedEvent.endsAt,
          eventId: updatedEvent.id,
        });
      } catch (error) {
        this.logger.warn(
          `Failed to send invite to ${invitedUser.email} for event ${updatedEvent.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return updatedEvent;
  }

  async acceptInvitation(userId: string, eventId: string) {
    const participant = await this.prisma.eventParticipant.findFirst({
      where: {
        eventId,
        userId,
      },
    });

    if (!participant) {
      throw new BadRequestException('Приглашение на мероприятие не найдено');
    }

    await this.prisma.eventParticipant.update({
      where: { id: participant.id },
      data: {
        status: EventParticipantStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    return this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async deleteEvent(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, organizerId: true },
    });

    if (!event) {
      throw new BadRequestException('Мероприятие не найдено');
    }

    if (event.organizerId !== userId) {
      throw new BadRequestException('Удалять мероприятие может только организатор');
    }

    await this.prisma.event.delete({
      where: { id: eventId },
    });

    return { success: true };
  }
}
