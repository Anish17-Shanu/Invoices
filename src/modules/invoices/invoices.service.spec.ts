import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceItem, ProductsServices, Payment } from '../../entities';
import { EventService } from '../event/event.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InvoiceStatus } from '../../common/enums';

type MockRepo<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const mockInvoiceRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
});
const mockInvoiceItemRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});
const mockProductRepo = (): MockRepo => ({
  findOne: jest.fn(),
});
const mockPaymentRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});
const mockEventService = { emit: jest.fn() };

describe('InvoicesService', () => {
  let service: InvoicesService;
  let invoiceRepo: MockRepo;
  let invoiceItemRepo: MockRepo;
  let productRepo: MockRepo;
  let paymentRepo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo() },
        { provide: getRepositoryToken(InvoiceItem), useValue: mockInvoiceItemRepo() },
        { provide: getRepositoryToken(ProductsServices), useValue: mockProductRepo() },
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo() },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get(InvoicesService);
    invoiceRepo = module.get(getRepositoryToken(Invoice));
    invoiceItemRepo = module.get(getRepositoryToken(InvoiceItem));
    productRepo = module.get(getRepositoryToken(ProductsServices));
    paymentRepo = module.get(getRepositoryToken(Payment));
  });

  // -------------------- CREATE INVOICE --------------------
  describe('create', () => {
    it('should create an invoice with product items', async () => {
      const dto = {
        customerName: 'Test Customer',
        items: [{ productId: 'p1', quantity: 2, rate: 100 }],
      };

      const product = { productId: 'p1', gstRatePercent: 18, description: 'Prod1', hsnSacCode: '1234' };
      productRepo.findOne.mockResolvedValue(product);

      const invoiceItem = { ...dto.items[0], taxAmount: 36, lineTotal: 236 };
      invoiceItemRepo.create.mockReturnValue(invoiceItem);

      const invoice = { invoiceId: 'i1', ...dto, items: [invoiceItem] };
      invoiceRepo.create.mockReturnValue(invoice);
      invoiceRepo.save.mockResolvedValue(invoice);
      invoiceRepo.findOne.mockResolvedValue(invoice);

      const result = await service.create('org1', dto as any);

      expect(result).toEqual(invoice);
      expect(mockEventService.emit).toHaveBeenCalledWith(
        'invoice.created',
        expect.objectContaining({ invoiceId: 'i1', organizationId: 'org1' }),
      );
    });

    it('should throw if product not found', async () => {
      const dto = { items: [{ productId: 'pX', quantity: 1, rate: 50 }] };
      productRepo.findOne.mockResolvedValue(null);

      await expect(service.create('org1', dto as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw if no productId and no gstRatePercent', async () => {
      const dto = { items: [{ quantity: 1, rate: 50 }] };
      await expect(service.create('org1', dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------- GET SINGLE INVOICE --------------------
  describe('findOne', () => {
    it('should return invoice if found', async () => {
      const invoice = { invoiceId: 'i1' };
      invoiceRepo.findOne.mockResolvedValue(invoice);

      const result = await service.findOne('org1', 'i1');
      expect(result).toEqual(invoice);
    });

    it('should throw if invoice not found', async () => {
      invoiceRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('org1', 'x')).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------- UPDATE INVOICE --------------------
  describe('update', () => {
    it('should update draft invoice', async () => {
      const invoice = { invoiceId: 'i1', status: InvoiceStatus.DRAFT, items: [], organizationId: 'org1' };
      jest.spyOn(service, 'findOne').mockResolvedValue(invoice as any);
      invoiceRepo.save.mockResolvedValue(invoice);

      const result = await service.update('org1', 'i1', { customerName: 'Updated' } as any);

      expect(result).toEqual(invoice);
      expect(mockEventService.emit).toHaveBeenCalledWith(
        'invoice.updated',
        expect.objectContaining({ invoiceId: 'i1', organizationId: 'org1' }),
      );
    });

    it('should throw if invoice is not draft', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ status: InvoiceStatus.PAID } as any);
      await expect(service.update('org1', 'i1', {} as any)).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------- SEND INVOICE --------------------
  describe('sendInvoice', () => {
    it('should send a draft invoice', async () => {
      const invoice = { invoiceId: 'i1', status: InvoiceStatus.DRAFT, organizationId: 'org1' };
      jest.spyOn(service, 'findOne').mockResolvedValue(invoice as any);
      invoiceRepo.save.mockResolvedValue({ ...invoice, status: InvoiceStatus.SENT });

      const result = await service.sendInvoice('org1', 'i1');
      expect(result.status).toBe(InvoiceStatus.SENT);
      expect(mockEventService.emit).toHaveBeenCalledWith(
        'invoice.sent',
        expect.objectContaining({ invoiceId: 'i1', organizationId: 'org1' }),
      );
    });

    it('should throw if invoice is not draft', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ status: InvoiceStatus.SENT } as any);
      await expect(service.sendInvoice('org1', 'i1')).rejects.toThrow(BadRequestException);
    });
  });

  // -------------------- VOID INVOICE --------------------
  describe('voidInvoice', () => {
    it('should void a non-paid invoice', async () => {
      const invoice = { invoiceId: 'i1', status: InvoiceStatus.DRAFT, organizationId: 'org1' };
      jest.spyOn(service, 'findOne').mockResolvedValue(invoice as any);

      paymentRepo.find.mockResolvedValue([]);

      invoiceRepo.save.mockResolvedValue({ ...invoice, status: InvoiceStatus.DRAFT });

      await service.voidInvoice('org1', 'i1');

      expect(invoiceRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: InvoiceStatus.DRAFT }));
      expect(mockEventService.emit).toHaveBeenCalledWith(
        'invoice.voided',
        expect.objectContaining({ invoiceId: 'i1', organizationId: 'org1' }),
      );
    });

    it('should throw if invoice is paid', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ status: InvoiceStatus.PAID } as any);
      await expect(service.voidInvoice('org1', 'i1')).rejects.toThrow(ConflictException);
    });
  });
});
