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
  ) {}

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

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.email) throw new UnauthorizedException('Access denied');

    if (!user || !user.hashedRt) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshMatches = await bcrypt.compare(refreshToken, user.hashedRt);
    if (!refreshMatches) throw new UnauthorizedException('Invalid token');

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

  private async generateTokens(id: string, login: string, role: Role) {
    const jwtSecret = this.configService.get<string>('app.jwt.secret');
    const jwtRefreshSecret = this.configService.get<string>('app.jwt.refreshSecret');

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessToken = jwt.sign({ id, login, role }, jwtSecret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(
      { id, login, role },
      jwtRefreshSecret,
      {
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
