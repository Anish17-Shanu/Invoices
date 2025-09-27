// src/common/guards/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  IS_PUBLIC_KEY,
  ROLES_KEY,
  ORGANIZATION_KEY,
} from '../decorators/auth.decorator';
import { JwtPayload, RequestUser } from '../interfaces/auth.interface';
import { UserRole } from '../enums';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Pass all roles as an array
      const user: RequestUser = {
        ...payload,
        roles: payload.roles,
        role: UserRole.VIEWER
      };

      request.user = user;

      // Role check (optional, RolesGuard will also check)
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (requiredRoles) {
        const hasRequiredRole = user.roles.some((role) =>
          requiredRoles.includes(role),
        );
        if (!hasRequiredRole) {
          throw new ForbiddenException('Insufficient permissions');
        }
      }

      // Organization param check
      const orgParam = this.reflector.getAllAndOverride<string>(
        ORGANIZATION_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (orgParam) {
        const requestedOrgId = request.params?.[orgParam];
        if (!requestedOrgId) {
          throw new ForbiddenException('Organization ID is required');
        }
        // Optional: validate user belongs to this org
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
