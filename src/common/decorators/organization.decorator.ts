import { SetMetadata } from '@nestjs/common';

export const ORGANIZATION_KEY = 'organizationId';
export const OrganizationParam = (paramName: string = 'orgId') =>
  SetMetadata(ORGANIZATION_KEY, paramName);
