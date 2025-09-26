import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvent } from '../../common/enums/app-event.enum';


@Injectable()
export class EventListener {
  private readonly logger = new Logger(EventListener.name);

  // -------------------- INVOICES --------------------
  @OnEvent('invoice.created')
  handleInvoiceCreated(payload: { invoiceId: string; partnerId: string }) {
    this.logger.log(`Invoice Created: ${payload.invoiceId} for Partner: ${payload.partnerId}`);
    // Add extra logic: e.g., send email, push notification
  }

  @OnEvent('invoice.updated')
  handleInvoiceUpdated(payload: { invoiceId: string }) {
    this.logger.log(`Invoice Updated: ${payload.invoiceId}`);
  }

  // -------------------- PAYMENTS --------------------
  @OnEvent('payment.received')
  handlePaymentReceived(payload: { paymentId: string; invoiceId: string; amount: number }) {
    this.logger.log(`Payment Received: ${payload.paymentId} for Invoice: ${payload.invoiceId}, Amount: ${payload.amount}`);
    // e.g., update invoice status or notify finance
  }

  // -------------------- PRODUCTS / SERVICES --------------------
  @OnEvent('product.created')
  handleProductCreated(payload: { productId: string }) {
    this.logger.log(`Product Created: ${payload.productId}`);
  }

  @OnEvent('product.updated')
  handleProductUpdated(payload: { productId: string }) {
    this.logger.log(`Product Updated: ${payload.productId}`);
  }

  // -------------------- BUSINESS PARTNERS --------------------
  @OnEvent('partner.created')
  handlePartnerCreated(payload: { partnerId: string }) {
    this.logger.log(`Partner Created: ${payload.partnerId}`);
  }

  @OnEvent('partner.updated')
  handlePartnerUpdated(payload: { partnerId: string }) {
    this.logger.log(`Partner Updated: ${payload.partnerId}`);
  }

  // -------------------- COMPLIANCE --------------------
  @OnEvent('ewaybill.generated')
  handleEwayBillGenerated(payload: { ewbId: string; invoiceId: string }) {
    this.logger.log(`E-Way Bill Generated: ${payload.ewbId} for Invoice: ${payload.invoiceId}`);
  }

  @OnEvent('gstr.filed')
  handleGstrFiled(payload: { filingId: string; organizationId: string; period: string }) {
    this.logger.log(`GSTR Filed: ${payload.filingId} for Organization: ${payload.organizationId} (${payload.period})`);
  }
}
