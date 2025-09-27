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
 * RolesGuard ensures the current user has
 * at least one of the allowed roles to access a route.
 *
 * Works together with the @Roles() decorator and AuthGuard.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    if (!user || !user.roles?.length) {
      this.logger.warn(`Access denied: no user or roles found on request`);
      throw new ForbiddenException('You must be authenticated');
    }

    // Allow access if user has at least one required role
    const hasRole = user.roles.some((role: UserRole) => requiredRoles.includes(role));

    if (!hasRole) {
      this.logger.warn(
        `Access denied for user ${user.userId} with roles [${user.roles.join(
          ', ',
        )}]. Required: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException(
        `You do not have the required role: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
