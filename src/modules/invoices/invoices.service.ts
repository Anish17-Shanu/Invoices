// src/modules/invoices/invoices.service.ts
import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceItem, ProductsServices, Payment } from '../../entities';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryDto,
} from './dto/invoice.dto';
import { InvoiceStatus } from '../../common/enums/invoice-status.enum';
import { EventService } from '../event/event.service';
import { AppEvent } from '../../common/enums/app-event.enum';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,

    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,

    @InjectRepository(ProductsServices)
    private productRepository: Repository<ProductsServices>,

    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,

    private eventService: EventService,
  ) {}

  // -------------------- PRIVATE HELPERS --------------------
  private async prepareInvoiceItems(
    items: (CreateInvoiceDto['items'] | UpdateInvoiceDto['items']),
    organizationId: string,
    invoiceId?: string,
  ): Promise<{ invoiceItems: InvoiceItem[]; subtotal: number; totalTax: number }> {
    let subtotal = 0;
    let totalTax = 0;

    const invoiceItems: InvoiceItem[] = await Promise.all(
      items.map(async (item) => {
        const lineTotal = item.quantity * item.rate;
        let taxAmount = 0;
        let description = item.description;
        let hsnSacCode = item.hsnSacCode;

        if (item.productId) {
          const product = await this.productRepository.findOne({
            where: { productId: item.productId, organizationId },
          });
          if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

          taxAmount = parseFloat(((lineTotal * Number(product.gstRatePercent)) / 100).toFixed(2));
          description = product.description ?? description;
          hsnSacCode = product.hsnSacCode;
        } else if (item.gstRatePercent !== undefined) {
          taxAmount = parseFloat(((lineTotal * item.gstRatePercent) / 100).toFixed(2));
        } else {
          throw new BadRequestException(
            'Each item must have either a productId or a gstRatePercent defined',
          );
        }

        subtotal += lineTotal;
        totalTax += taxAmount;

        return this.invoiceItemRepository.create({
          ...item,
          invoiceId,
          description,
          hsnSacCode,
          taxAmount,
          lineTotal: lineTotal + taxAmount,
        });
      }),
    );

    return { invoiceItems, subtotal, totalTax };
  }

  // -------------------- CREATE INVOICE --------------------
  async create(organizationId: string, createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const { items, ...invoiceData } = createInvoiceDto;

    const { invoiceItems, subtotal, totalTax } = await this.prepareInvoiceItems(items, organizationId);

    const invoice = this.invoiceRepository.create({
      ...invoiceData,
      organizationId,
      subtotal,
      totalTax,
      totalAmount: subtotal + totalTax,
      status: InvoiceStatus.DRAFT,
      items: invoiceItems,
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);
    this.logger.log(`Created invoice: ${savedInvoice.invoiceId}`);

    this.eventService.emit(AppEvent.INVOICE_CREATED, {
      invoiceId: savedInvoice.invoiceId,
      organizationId,
    });

    return this.findOne(organizationId, savedInvoice.invoiceId);
  }

  // -------------------- GET ALL INVOICES --------------------
  async findAll(organizationId: string, query: InvoiceQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      partnerId,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.partner', 'partner')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('invoice.payments', 'payments')
      .where('invoice.organizationId = :organizationId', { organizationId });

    if (status) qb.andWhere('invoice.status = :status', { status });
    if (partnerId) qb.andWhere('invoice.partnerId = :partnerId', { partnerId });
    if (fromDate) qb.andWhere('invoice.issueDate >= :fromDate', { fromDate });
    if (toDate) qb.andWhere('invoice.issueDate <= :toDate', { toDate });

    qb.orderBy(`invoice.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [invoices, total] = await qb.getManyAndCount();

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // -------------------- GET SINGLE INVOICE --------------------
  async findOne(organizationId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceId, organizationId },
      relations: ['partner', 'items', 'payments'],
    });

    if (!invoice) throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);

    return invoice;
  }

  // -------------------- UPDATE INVOICE --------------------
  async update(
    organizationId: string,
    invoiceId: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findOne(organizationId, invoiceId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be updated');
    }

    if (updateInvoiceDto.items) {
      const { items, ...invoiceData } = updateInvoiceDto;

      await this.invoiceItemRepository.delete({ invoiceId });

      const { invoiceItems, subtotal, totalTax } = await this.prepareInvoiceItems(
        items,
        organizationId,
        invoiceId,
      );

      await this.invoiceItemRepository.save(invoiceItems);

      Object.assign(invoice, {
        ...invoiceData,
        subtotal,
        totalTax,
        totalAmount: subtotal + totalTax,
      });
    } else {
      Object.assign(invoice, updateInvoiceDto);
    }

    const updatedInvoice = await this.invoiceRepository.save(invoice);
    this.logger.log(`Updated invoice: ${invoiceId}`);

    this.eventService.emit(AppEvent.INVOICE_UPDATED, { invoiceId, organizationId });

    return this.findOne(organizationId, invoiceId);
  }

  // -------------------- SEND INVOICE --------------------
  async sendInvoice(organizationId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.findOne(organizationId, invoiceId);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be sent');
    }

    invoice.status = InvoiceStatus.SENT;
    await this.invoiceRepository.save(invoice);
    this.logger.log(`Sent invoice: ${invoiceId}`);

    this.eventService.emit(AppEvent.INVOICE_SENT, { invoiceId, organizationId });

    return invoice;
  }

  // -------------------- VOID INVOICE --------------------
  async voidInvoice(organizationId: string, invoiceId: string): Promise<void> {
    const invoice = await this.findOne(organizationId, invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new ConflictException('Paid invoices cannot be voided');
    }

    invoice.status = InvoiceStatus.DRAFT; // or consider InvoiceStatus.VOIDED
    await this.invoiceRepository.save(invoice);
    this.logger.log(`Voided invoice: ${invoiceId}`);

    this.eventService.emit(AppEvent.INVOICE_VOIDED, { invoiceId, organizationId });
  }
}
