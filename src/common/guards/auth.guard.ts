// src/common/guards/auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY, ROLES_KEY, ORGANIZATION_KEY } from '../decorators/auth.decorator';
import { JwtPayload, RequestUser } from '../interfaces/auth.interface';
import { UserRole } from '../enums';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

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
    if (!token) throw new UnauthorizedException('Authorization token is required');

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user: RequestUser = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role ?? UserRole.VIEWER,
      organizationId: payload.organizationId,
      workspaceId: payload.workspaceId,
      roles: payload.roles ?? [payload.role],
      iat: payload.iat,
      exp: payload.exp,
    };
    request.user = user;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && !requiredRoles.some((r) => user.roles.includes(r))) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const orgParam = this.reflector.getAllAndOverride<string>(ORGANIZATION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (orgParam && request.params?.[orgParam] && user.organizationId !== request.params[orgParam]) {
      throw new ForbiddenException('Access to this organization is forbidden');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers?.authorization;
    const [type, token] = authHeader?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
