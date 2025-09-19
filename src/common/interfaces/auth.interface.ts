export interface JwtPayload {
  userId: string;
  workspaceId: string;
  roles: string[];
  organizationId?: string;
  iat?: number;
  exp?: number;
}

export interface RequestUser extends JwtPayload {
  // Additional user context if needed
}
