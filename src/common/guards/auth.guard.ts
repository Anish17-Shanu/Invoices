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
import { IS_PUBLIC_KEY, ROLES_KEY, ORGANIZATION_KEY } from '../decorators/auth.decorator';
import { JwtPayload, RequestUser } from '../interfaces/auth.interface';
import { UserRole } from '../enums';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token is required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Attach user to request
      request['user'] = payload as RequestUser;

      // Check role-based access
      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (requiredRoles) {
        const hasRequiredRole = requiredRoles.some(role => 
          payload.roles?.includes(role)
        );

        if (!hasRequiredRole) {
          throw new ForbiddenException('Insufficient permissions');
        }
      }

      // Check organization access
      const orgParam = this.reflector.getAllAndOverride<string>(ORGANIZATION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (orgParam) {
        const requestedOrgId = request.params?.[orgParam];
        
        // For now, we'll validate that the user has access to the organization
        // In a full implementation, this would check against the User entity
        if (!requestedOrgId) {
          throw new ForbiddenException('Organization ID is required');
        }
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers?.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
