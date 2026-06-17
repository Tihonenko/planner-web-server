import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { LoginDTO } from './dto/login.dto';
import { EmailAuthType, Role } from '@prisma/client';
import { MailService } from './mail.service';
import { RequestRegisterCodeDto } from './dto/request-register-code.dto';
import { ConfirmRegisterCodeDto } from './dto/confirm-register-code.dto';
import { RequestPasswordChangeDto } from './dto/request-password-change.dto';
import { ConfirmPasswordChangeDto } from './dto/confirm-password-change.dto';
import { randomUUID } from 'crypto';
import { HttpMessages } from '@src/common/i18n/http-messages';
import { assertUserIsActive } from '@src/common/user-active';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async requestRegisterCode(dto: RequestRegisterCodeDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException(HttpMessages.userAlreadyExists);

    await this.prisma.emailAuth.updateMany({
      where: {
        email: dto.email,
        type: EmailAuthType.REGISTER,
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailAuth.create({
      data: {
        email: dto.email,
        token: randomUUID(),
        code,
        type: EmailAuthType.REGISTER,
        payload: {
          name: dto.name,
          passwordHash: hashedPassword,
        },
        expiresAt,
      },
    });

    await this.mailService.sendRegisterCode(dto.email, dto.name, code);

    return { message: 'Код подтверждения отправлен на email' };
  }

  async register(dto: ConfirmRegisterCodeDto) {
    const confirmation = await this.prisma.emailAuth.findFirst({
      where: {
        email: dto.email,
        code: dto.code,
        type: EmailAuthType.REGISTER,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!confirmation) {
      throw new BadRequestException(HttpMessages.invalidConfirmationCode);
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException(HttpMessages.userAlreadyExists);

    const payload = confirmation.payload as
      | { name?: string; passwordHash?: string }
      | null;

    if (!payload?.passwordHash || !payload?.name) {
      throw new BadRequestException(HttpMessages.registrationSessionCorrupted);
    }

    const user = await this.prisma.user.create({
      data: {
        name: payload.name,
        email: dto.email,
        password: payload.passwordHash,
        role: Role.USER,
      },
    });

    await this.prisma.emailAuth.update({
      where: { id: confirmation.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        userId: user.id,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async requestPasswordChangeCode(
    userId: string,
    dto: RequestPasswordChangeDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(HttpMessages.userNotFound);
    }

    assertUserIsActive(user.isActive);

    await this.prisma.emailAuth.updateMany({
      where: {
        email: user.email,
        type: EmailAuthType.RESET_PASSWORD,
        isUsed: false,
      },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.emailAuth.create({
      data: {
        email: user.email,
        token: randomUUID(),
        code,
        type: EmailAuthType.RESET_PASSWORD,
        userId: user.id,
        payload: { passwordHash: hashedPassword },
        expiresAt,
      },
    });

    await this.mailService.sendPasswordChangeCode(
      user.email,
      user.name,
      code,
    );

    return { message: 'Код подтверждения отправлен на email' };
  }

  async confirmPasswordChange(userId: string, dto: ConfirmPasswordChangeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(HttpMessages.userNotFound);
    }

    assertUserIsActive(user.isActive);

    const confirmation = await this.prisma.emailAuth.findFirst({
      where: {
        email: user.email,
        userId: user.id,
        code: dto.code,
        type: EmailAuthType.RESET_PASSWORD,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!confirmation) {
      throw new BadRequestException(HttpMessages.invalidConfirmationCode);
    }

    const payload = confirmation.payload as { passwordHash?: string } | null;

    if (!payload?.passwordHash) {
      throw new BadRequestException(HttpMessages.passwordChangeSessionCorrupted);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: payload.passwordHash,
          hashedRt: null,
        },
      }),
      this.prisma.emailAuth.update({
        where: { id: confirmation.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      }),
    ]);

    return { message: HttpMessages.passwordChanged };
  }

  async login(dto: LoginDTO) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException(HttpMessages.incorrectLoginOrPassword);

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException(HttpMessages.incorrectLoginOrPassword);

    if (user.isActive === false) {
      throw new UnauthorizedException(HttpMessages.accountBlocked);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return tokens;
  }

  async refreshTokens(refreshToken: string) {
    const jwtRefreshSecret = this.configService.get<string>(
      'app.jwt.refreshSecret',
    );
    if (!jwtRefreshSecret) {
      throw new UnauthorizedException(HttpMessages.serverConfigError);
    }

    let payload: { id: string; email: string; role: Role };
    try {
      payload = jwt.verify(refreshToken, jwtRefreshSecret) as typeof payload;
    } catch {
      throw new UnauthorizedException(HttpMessages.invalidRefreshToken);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!user || !user.email) throw new UnauthorizedException(HttpMessages.accessDenied);

    assertUserIsActive(user.isActive);

    if (!user.hashedRt) {
      throw new UnauthorizedException(HttpMessages.sessionExpired);
    }

    const refreshMatches = await bcrypt.compare(refreshToken, user.hashedRt);
    if (!refreshMatches) throw new UnauthorizedException(HttpMessages.invalidToken);

    // Генерируем новые токены
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRt = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt },
    });
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRt: null },
    });
  }

  private async generateTokens(id: string, email: string, role: Role) {
    const jwtSecret = this.configService.get<string>('app.jwt.secret');
    const jwtRefreshSecret = this.configService.get<string>(
      'app.jwt.refreshSecret',
    );

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessToken = jwt.sign({ id, email, role }, jwtSecret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ id, email, role }, jwtRefreshSecret, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
