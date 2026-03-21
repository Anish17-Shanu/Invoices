// invoices-srv/src/common/enums/app-event.enum.ts

export enum AppEvent {
  // ---------- Invoices ----------
  INVOICE_CREATED = 'invoice.created',
  INVOICE_UPDATED = 'invoice.updated',
  INVOICE_SENT = 'invoice.sent',
  INVOICE_VOIDED = 'invoice.voided',
  INVOICE_PAID = 'invoice.paid',

  // ---------- Payments ----------
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_UPDATED = 'payment.updated',

  // ---------- Business Partners ----------
  PARTNER_CREATED = 'partner.created',
  PARTNER_UPDATED = 'partner.updated',

  // ---------- Products/Services ----------
  PRODUCT_SERVICE_CREATED = 'product-service.created',
  PRODUCT_SERVICE_UPDATED = 'product-service.updated',

  // ---------- Compliance ----------
  EWAY_BILL_CREATED = 'eway-bill.created',
  EWAY_BILL_UPDATED = 'eway-bill.updated',
  GSTR_FILING_GENERATED = 'gstr-filing.generated',
  GSTR_FILING_UPDATED = 'gstr-filing.updated',
  GSTR_FILED = 'gstr.filed',
  EWAYBILL_GENERATED = 'ewaybill.generated',

  // ---------- Events (Custom Business Events) ----------
  CUSTOM_EVENT = 'custom.event', // placeholder for future use
}
