import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { Repository } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { Invoice } from '../../entities/invoice.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventService } from '../event/event.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: Repository<Payment>;
  let invoiceRepo: Repository<Invoice>;

  const mockPaymentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockInvoiceRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockEventService = {
    emit: jest.fn(),
  };

  const mockUser: RequestUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN],
    organizationId: 'org-1',
    workspaceId: 'workspace-1',
    name: 'Test User',
    iat: 1690000000,
    exp: 1690003600,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Invoice), useValue: mockInvoiceRepo },
        { provide: EventService, useValue: mockEventService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepo = module.get(getRepositoryToken(Payment));
    invoiceRepo = module.get(getRepositoryToken(Invoice));
  });

  afterEach(() => jest.clearAllMocks());

  describe('createPayment', () => {
    it('should throw NotFoundException if invoice does not exist', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createPayment(
          'inv-1',
          { amount: 100, mode: 'UPI' as any, paymentDate: new Date().toISOString() },
          mockUser
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payment exceeds remaining', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue({ totalAmount: 500, amountPaid: 400 });

      await expect(
        service.createPayment(
          'inv-1',
          { amount: 200, mode: 'UPI' as any, paymentDate: new Date().toISOString() },
          mockUser
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and save a payment', async () => {
      const invoice = { invoiceId: 'inv-1', organizationId: 'org-1', totalAmount: 1000, amountPaid: 200 };
      const payment = { paymentId: 'pay-1', amount: 300, invoice } as Payment;

      mockInvoiceRepo.findOne.mockResolvedValue(invoice);
      mockPaymentRepo.create.mockReturnValue(payment);
      mockPaymentRepo.save.mockResolvedValue(payment);
      mockInvoiceRepo.save.mockResolvedValue(invoice);

      const result = await service.createPayment(
        'inv-1',
        { amount: 300, mode: 'UPI' as any, paymentDate: new Date().toISOString() },
        mockUser
      );

      expect(result.amount).toBe(300);
      expect(mockPaymentRepo.save).toHaveBeenCalledWith(payment);
      expect(mockEventService.emit).toHaveBeenCalled();
    });
  });

  describe('getPaymentsByInvoice', () => {
    it('should return list of payments', async () => {
      const payments = [{ paymentId: 'p1', invoiceId: 'i1', amount: 100 }] as any;
      mockPaymentRepo.find.mockResolvedValue(payments);

      const result = await service.getPaymentsByInvoice('i1');
      expect(result).toEqual(expect.arrayContaining(payments));
    });
  });

  describe('getPaymentById', () => {
    it('should throw NotFoundException if not found', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      await expect(service.getPaymentById('p1')).rejects.toThrow(NotFoundException);
    });

    it('should return payment if found', async () => {
      const payment = { paymentId: 'p1', invoiceId: 'i1', amount: 200 } as any;
      mockPaymentRepo.findOne.mockResolvedValue(payment);

      const result = await service.getPaymentById('p1');
      expect(result).toEqual(expect.objectContaining(payment));
    });
  });

  describe('updatePayment', () => {
    it('should throw NotFoundException if not found', async () => {
      mockPaymentRepo.findOne.mockResolvedValue(null);
      await expect(service.updatePayment('p1', { amount: 200 }, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should update and save payment', async () => {
      const payment = { paymentId: 'p1', invoiceId: 'i1', amount: 100, invoice: { invoiceId: 'i1', amountPaid: 100 } } as any;
      const updated = { ...payment, amount: 200 };

      mockPaymentRepo.findOne.mockResolvedValue(payment);
      mockPaymentRepo.save.mockResolvedValue(updated);
      mockPaymentRepo.find.mockResolvedValue([updated]);
      mockInvoiceRepo.save.mockResolvedValue(updated.invoice);

      const result = await service.updatePayment('p1', { amount: 200 }, mockUser);
      expect(result.amount).toBe(200);
      expect(mockPaymentRepo.save).toHaveBeenCalled();
      expect(mockEventService.emit).toHaveBeenCalled();
    });
  });
});
