import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { RegisterDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) { }

  async register(dto: RegisterDTO) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new BadRequestException('User already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: Role.USER,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async login(dto: LoginDTO) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Incorrect login or password');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Incorrect login or password');

    if (user.isActive === false) {
      throw new UnauthorizedException('Your account has been blocked');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return tokens;
  }

  /**
   * Обновляет токены используя refresh token
   * userId извлекается из самого refresh token JWT для безопасности
   */
  async refreshTokens(refreshToken: string) {
    const jwtRefreshSecret = this.configService.get<string>('app.jwt.refreshSecret');
    if (!jwtRefreshSecret) {
      throw new UnauthorizedException('Server configuration error');
    }

    // Верифицируем и декодируем refresh token
    let payload: { id: string; email: string; role: Role };
    try {
      payload = jwt.verify(refreshToken, jwtRefreshSecret) as typeof payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!user || !user.email) throw new UnauthorizedException('Access denied');

    if (!user.hashedRt) {
      throw new UnauthorizedException('Session expired, please login again');
    }

    // Проверяем, что refresh token совпадает с сохраненным хэшем
    const refreshMatches = await bcrypt.compare(refreshToken, user.hashedRt);
    if (!refreshMatches) throw new UnauthorizedException('Invalid token');

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
    const jwtRefreshSecret = this.configService.get<string>('app.jwt.refreshSecret');

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessToken = jwt.sign({ id, email, role }, jwtSecret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(
      { id, email, role },
      jwtRefreshSecret,
      {
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
