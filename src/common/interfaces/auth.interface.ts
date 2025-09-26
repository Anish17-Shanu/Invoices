// src/common/interfaces/auth.interface.ts
import { UserRole } from '../enums';

export interface JwtPayload {
  /** Unique user ID from Flocci OS (JWT subject) */
  userId: string;

  /** Workspace the user belongs to */
  workspaceId: string;

  /** Organization the user is currently scoped to */
  organizationId?: string;

  /** User roles (from JWT). Can be multiple if cross-org */
  roles: UserRole[];

  /** JWT issued at timestamp */
  iat?: number;

  /** JWT expiry timestamp */
  exp?: number;
}

export interface RequestUser extends JwtPayload {
  /** Active role for this request context (resolved from roles[]) */
  role: UserRole;

  /** Optional email for convenience */
  email?: string;

  /** Optional display name */
  name?: string;
}
