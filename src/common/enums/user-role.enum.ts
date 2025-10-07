// src/common/enums/user-role.enum.ts
export enum UserRole {
  SUPER_ADMIN = 'super_admin', // ✅ lowercase for DB consistency
  ADMIN = 'admin',
  FINANCE_MANAGER = 'finance_manager',
  SALES = 'sales',
  PARTNER = 'partner',
  ACCOUNTANT = 'accountant',
  AUDITOR = 'auditor',
  GUEST = 'guest',
  VIEWER = 'viewer',
}
