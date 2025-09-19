import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceItem } from '../../entities';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceQueryDto } from './dto/invoice.dto';
import { InvoiceStatus } from '../../common/enums';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
  ) {}

  async create(organizationId: string, createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    const { items, ...invoiceData } = createInvoiceDto;
    
    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    
    const invoiceItems = items.map(item => {
      const lineTotal = item.quantity * item.rate;
      const taxAmount = lineTotal * 0.18; // Assuming 18% GST, should be dynamic
      subtotal += lineTotal;
      totalTax += taxAmount;
      
      return this.invoiceItemRepository.create({
        ...item,
        taxAmount,
        lineTotal: lineTotal + taxAmount,
      });
    });
    
    const invoice = this.invoiceRepository.create({
      ...invoiceData,
      organizationId,
      subtotal,
      totalTax,
      totalAmount: subtotal + totalTax,
      status: InvoiceStatus.DRAFT,
      items: invoiceItems,
    });
    
    const saved = await this.invoiceRepository.save(invoice);
    this.logger.log(`Created invoice: ${saved.invoiceId}`);
    
    return this.findOne(organizationId, saved.invoiceId);
  }

  async findAll(organizationId: string, query: InvoiceQueryDto) {
    const { page = 1, limit = 10, status, partnerId, fromDate, toDate, sortBy = 'createdAt', sortOrder = 'DESC' } = query;
    
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.partner', 'partner')
      .leftJoinAndSelect('invoice.items', 'items')
      .where('invoice.organizationId = :organizationId', { organizationId });
    
    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }
    
    if (partnerId) {
      queryBuilder.andWhere('invoice.partnerId = :partnerId', { partnerId });
    }
    
    if (fromDate) {
      queryBuilder.andWhere('invoice.issueDate >= :fromDate', { fromDate });
    }
    
    if (toDate) {
      queryBuilder.andWhere('invoice.issueDate <= :toDate', { toDate });
    }
    
    queryBuilder
      .orderBy(`invoice.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);
    
    const [invoices, total] = await queryBuilder.getManyAndCount();
    
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

  async findOne(organizationId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoiceId, organizationId },
      relations: ['partner', 'items', 'payments'],
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    return invoice;
  }

  async update(organizationId: string, invoiceId: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(organizationId, invoiceId);
    
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be updated');
    }
    
    // If items are provided, recalculate totals
    if (updateInvoiceDto.items) {
      const { items, ...invoiceData } = updateInvoiceDto;
      
      // Remove existing items
      await this.invoiceItemRepository.delete({ invoiceId });
      
      // Recalculate totals
      let subtotal = 0;
      let totalTax = 0;
      
      const invoiceItems = items.map(item => {
        const lineTotal = item.quantity * item.rate;
        const taxAmount = lineTotal * 0.18;
        subtotal += lineTotal;
        totalTax += taxAmount;
        
        return this.invoiceItemRepository.create({
          ...item,
          invoiceId,
          taxAmount,
          lineTotal: lineTotal + taxAmount,
        });
      });
      
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
    
    const updated = await this.invoiceRepository.save(invoice);
    this.logger.log(`Updated invoice: ${invoiceId}`);
    
    return this.findOne(organizationId, invoiceId);
  }

  async sendInvoice(organizationId: string, invoiceId: string): Promise<Invoice> {
    const invoice = await this.findOne(organizationId, invoiceId);
    
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be sent');
    }
    
    invoice.status = InvoiceStatus.SENT;
    await this.invoiceRepository.save(invoice);
    
    this.logger.log(`Sent invoice: ${invoiceId}`);
    
    // TODO: Publish event
    
    return invoice;
  }

  async voidInvoice(organizationId: string, invoiceId: string): Promise<void> {
    const invoice = await this.findOne(organizationId, invoiceId);
    
    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Paid invoices cannot be voided');
    }
    
    invoice.status = InvoiceStatus.VOID;
    await this.invoiceRepository.save(invoice);
    
    this.logger.log(`Voided invoice: ${invoiceId}`);
  }
}
