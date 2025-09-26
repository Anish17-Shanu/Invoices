import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestUser } from '../interfaces/auth.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext): any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    if (!user) {
      throw new UnauthorizedException('No authenticated user found in request');
    }

    // If a property is requested (e.g. 'userId'), return that property
    return data ? user[data] : user;
  },
);
