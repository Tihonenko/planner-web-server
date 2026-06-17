import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { assertUserIsActive } from '../user-active';
import { HttpMessages } from '../i18n/http-messages';

export interface JwtPayloadAuth {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException(HttpMessages.unauthorized);

    const token = authHeader.split(' ')[1];

    if (!token) throw new UnauthorizedException(HttpMessages.unauthorized);

    const jwtSecret = this.configService.get<string>('app.jwt.secret');
    if (!jwtSecret) {
      throw new UnauthorizedException(HttpMessages.serverConfigError);
    }

    let payload: JwtPayloadAuth;
    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayloadAuth;
    } catch {
      throw new UnauthorizedException(HttpMessages.invalidToken);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
      select: { isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException(HttpMessages.accessDenied);
    }

    assertUserIsActive(user.isActive);

    request.user = payload;

    return true;
  }
}
