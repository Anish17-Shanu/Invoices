// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

/**
 * Roles decorator
 * 
 * Usage:
 *   @Roles(UserRole.ADMIN)
 *   @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
 *
 * The RolesGuard will read this metadata and enforce access.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
