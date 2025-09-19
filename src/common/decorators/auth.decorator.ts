import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ORGANIZATION_KEY = 'organizationId';
export const OrganizationParam = (paramName: string = 'orgId') => 
  SetMetadata(ORGANIZATION_KEY, paramName);
