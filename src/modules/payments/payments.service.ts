import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { Invoice } from '../../entities/invoice.entity';
import { CreatePaymentDto, PaymentResponseDto } from './dto/payment.dto';
import { EventService } from '../event/event.service';
import { AppEvent } from '../../common/enums/app-event.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly eventService: EventService, // inject EventService
  ) {}

  // -------------------- CREATE PAYMENT --------------------
  async createPayment(invoiceId: string, dto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const invoice = await this.invoiceRepo.findOne({ where: { invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    // Optional: check if payment exceeds invoice total
    const totalPaid = invoice.amountPaid ?? 0;
    const remaining = invoice.totalAmount - totalPaid;
    if (dto.amount > remaining) {
      throw new BadRequestException(`Payment exceeds remaining invoice amount (${remaining})`);
    }

    const payment = this.paymentRepo.create({
      invoice,
      organizationId: invoice.organizationId,
      ...dto,
    });

    await this.paymentRepo.save(payment);

    // Update invoice's amountPaid
    invoice.amountPaid = totalPaid + dto.amount;
    await this.invoiceRepo.save(invoice);

    // Emit event after payment creation
    this.eventService.emit(AppEvent.PAYMENT_CREATED, {
      paymentId: payment.paymentId,
      invoiceId: invoice.invoiceId,
      organizationId: invoice.organizationId,
      amount: payment.amount,
    });

    return this.toPaymentResponseDto(payment);
  }

  // -------------------- GET PAYMENTS BY INVOICE --------------------
  async getPaymentsByInvoice(invoiceId: string): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepo.find({ where: { invoiceId } });
    return payments.map(this.toPaymentResponseDto);
  }

  // -------------------- GET PAYMENT BY ID --------------------
  async getPaymentById(paymentId: string): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepo.findOne({ where: { paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.toPaymentResponseDto(payment);
  }

  // -------------------- UPDATE PAYMENT --------------------
  async updatePayment(paymentId: string, dto: Partial<CreatePaymentDto>): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepo.findOne({ where: { paymentId }, relations: ['invoice'] });
    if (!payment) throw new NotFoundException('Payment not found');

    Object.assign(payment, dto);
    await this.paymentRepo.save(payment);

    // Recalculate invoice amountPaid
    const payments = await this.paymentRepo.find({ where: { invoiceId: payment.invoiceId } });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    payment.invoice.amountPaid = totalPaid;
    await this.invoiceRepo.save(payment.invoice);

    // Emit event after payment update
    this.eventService.emit(AppEvent.PAYMENT_UPDATED, {
      paymentId: payment.paymentId,
      invoiceId: payment.invoiceId,
      organizationId: payment.organizationId,
      amount: payment.amount,
    });

    return this.toPaymentResponseDto(payment);
  }

  // -------------------- CONVERT PAYMENT TO DTO --------------------
  private toPaymentResponseDto(payment: Payment): PaymentResponseDto {
    return {
      paymentId: payment.paymentId,
      invoiceId: payment.invoiceId,
      organizationId: payment.organizationId,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      mode: payment.mode,
      transactionId: payment.transactionId,
      notes: payment.notes,
      createdAt: payment.createdAt,
    };
  }
}
