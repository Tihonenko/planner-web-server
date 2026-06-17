import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('app.mail.host', '127.0.0.1');
    const port = this.configService.get<number>('app.mail.port', 1025);
    this.from = this.configService.get<string>(
      'app.mail.from',
      'no-reply@planner.local',
    );

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
    });
  }

  async sendRegisterCode(email: string, name: string, code: string) {
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Registration code',
      text: `Hi, ${name}!\n\nYour registration code: ${code}\nCode is valid for 10 minutes.`,
    });

    this.logger.log(`Registration code sent to ${email}`);
  }

  async sendPasswordChangeCode(email: string, name: string | null, code: string) {
    const displayName = name?.trim() || 'пользователь';
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: 'Код для смены пароля',
      text:
        `Здравствуйте, ${displayName}!\n\n` +
        `Код для смены пароля: ${code}\n` +
        `Код действителен 10 минут.\n\n` +
        `Если вы не запрашивали смену пароля, проигнорируйте это письмо.`,
    });

    this.logger.log(`Password change code sent to ${email}`);
  }

  async sendEventInvite(params: {
    email: string;
    inviterName: string;
    eventTitle: string;
    startsAt: Date;
    endsAt: Date;
    eventId: string;
  }) {
    const { email, inviterName, eventTitle, startsAt, endsAt, eventId } = params;
    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `Приглашение на мероприятие: ${eventTitle}`,
      text:
        `Здравствуйте!\n\n` +
        `${inviterName} приглашает вас на мероприятие "${eventTitle}".\n` +
        `Начало: ${startsAt.toLocaleString('ru-RU')}\n` +
        `Окончание: ${endsAt.toLocaleString('ru-RU')}\n\n` +
        `Откройте приложение Planner и примите приглашение в карточке мероприятия.\n` +
        `ID мероприятия: ${eventId}\n`,
    });

    this.logger.log(`Event invite sent to ${email} for event ${eventId}`);
  }
}
