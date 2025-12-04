import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

export interface JwtPayloadAuth {
  id: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException();

    const token = authHeader.split(' ')[1];

    if (!token) throw new UnauthorizedException();

    const jwtSecret = this.configService.get<string>('app.jwt.secret');
    if (!jwtSecret) {
      throw new UnauthorizedException('JWT secret is not configured');
    }

    try {
      const payload = jwt.verify(
        token,
        jwtSecret,
      ) as JwtPayloadAuth;

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
