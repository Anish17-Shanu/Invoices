import { UserRole } from '../enums';

export interface JwtPayload {
  /** Unique user ID (JWT subject) */
  sub: string;

  /** User email */
  email: string;

  /** Single primary role for the user */
  role: UserRole;

  /** Optional workspace identifier for legacy integrations */
  workspaceId?: string;

  /** Organization the user is currently scoped to (optional) */
  organizationId?: string;

  /** Multiple roles if cross-org access is allowed (optional) */
  roles?: UserRole[];

  /** JWT issued at timestamp */
  iat?: number;

  /** JWT expiry timestamp */
  exp?: number;
}

/**
 * Extends JwtPayload for request context
 */
export interface RequestUser {
  /** Map JWT sub to userId */
  userId: string;

  email: string;
  role: UserRole;

  /** Multiple roles for cross-org */
  roles: UserRole[];

  workspaceId?: string;
  organizationId?: string;

  /** Optional display name */
  name?: string;

  iat?: number;
  exp?: number;
}
