// src/common/enums/index.ts

// ------------------------
// Core Enums
// ------------------------
export enum OrganizationType {
  PROPRIETORSHIP = 'proprietorship',
  PARTNERSHIP = 'partnership',
  LLP = 'llp',
  PVT_LTD = 'pvt_ltd',
  PUBLIC_LTD = 'public_ltd',
}

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

export enum PartnerType {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  BOTH = "BOTH",
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  VOID = 'void',
}

export enum PaymentMode {
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  CHEQUE = 'cheque',
}

export enum GstrFilingType {
  GSTR1 = 'GSTR1',
  GSTR3B = 'GSTR3B',
}

export enum GstrFilingStatus {
  PENDING = 'pending',
  FILED = 'filed',
  ERROR = 'error',
}
export enum EwayBillStatus {
  GENERATED = 'generated',
  CANCELLED = 'cancelled',
  UPDATED = 'updated',
}