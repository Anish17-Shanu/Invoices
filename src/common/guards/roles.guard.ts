import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';

/**
 * RolesGuard ensures that the current user has
 * the required role(s) to access a route.
 *
 * Works together with the @Roles() decorator and AuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read @Roles() metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn(`Access denied: no user on request`);
      throw new ForbiddenException('You must be authenticated');
    }

    if (!requiredRoles.includes(user.role)) {
      this.logger.warn(
        `Access denied for user ${user.userId} with role ${user.role}. Required: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `You do not have the required role: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
