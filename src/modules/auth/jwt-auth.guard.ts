import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  /**
   * Can be extended to add custom authorization logic
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      this.logger.warn(`Unauthorized access attempt: ${info?.message || 'No details'}`);
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user; // attaches the user to request automatically
  }
}
