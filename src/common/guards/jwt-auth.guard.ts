import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as jwt from 'jsonwebtoken';

export interface JwtPayloadAuth {
  id: string;
  login: string;
  role: Role;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException();

    const token = authHeader.split(' ')[1];

    if (!token) throw new UnauthorizedException();

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayloadAuth;

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
