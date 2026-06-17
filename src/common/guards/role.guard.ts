import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { HttpMessages } from '../i18n/http-messages';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {  
  constructor(private reflector: Reflector) {}

  private matchRoles(roles: string[], userRole: string) {
    if(!roles.some(role => role === userRole)) {
      throw new ForbiddenException(HttpMessages.insufficientPermissions);
    }

    return true
  }

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    return this.matchRoles(requiredRoles, user.role);
  }
}
