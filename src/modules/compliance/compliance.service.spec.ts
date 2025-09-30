import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { Repository } from 'typeorm';
import { EwayBill } from '../../entities/eway-bill.entity';
import { GstrFiling, GstrFilingStatus } from '../../entities/gstr-filing.entity';
import { Invoice } from '../../entities/invoice.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventService } from '../event/event.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let ewayBillRepo: Repository<EwayBill>;
  let gstrRepo: Repository<GstrFiling>;
  let invoiceRepo: Repository<Invoice>;
  let eventService: EventService;

  const mockUser: RequestUser = {
    userId: 'user-123',
    email: 'a@b.com',
    organizationId: 'org-123',
    workspaceId: 'ws-123',
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN],
  };

  const mockInvoice: Invoice = { invoiceId: 'inv-1', organizationId: 'org-123' } as any;
  const mockBill: EwayBill = { ewbId: 'ewb-1', invoiceId: 'inv-1', ewbNumber: 'EWB123', invoice: mockInvoice } as any;
  const mockGstr: GstrFiling = {
    filingId: 'filing-1',
    organizationId: 'org-123',
    type: 'GSTR1',
    period: '2025-09',
    status: GstrFilingStatus.PENDING,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        {
          provide: getRepositoryToken(EwayBill),
          useValue: {
            findOne: jest.fn().mockImplementation(async (opts) => {
              if (opts.where?.ewbNumber === 'EWB123') return mockBill;
              if (opts.where?.ewbId === 'ewb-1') return mockBill;
              return null;
            }),
            find: jest.fn().mockResolvedValue([mockBill]),
            create: jest.fn().mockReturnValue(mockBill),
            save: jest.fn().mockImplementation(async (bill) => ({ ...mockBill, ...bill })),
          },
        },
        {
          provide: getRepositoryToken(GstrFiling),
          useValue: {
            findOne: jest.fn().mockImplementation(async (opts) => {
              if (opts.where?.type === 'GSTR1' && opts.where?.period === '2025-09') return mockGstr;
              if (opts.where?.filingId === 'filing-1') return mockGstr;
              return null;
            }),
            find: jest.fn().mockResolvedValue([mockGstr]),
            create: jest.fn().mockReturnValue(mockGstr),
            save: jest.fn().mockImplementation(async (gstr) => ({ ...mockGstr, ...gstr })),
          },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            findOne: jest.fn().mockImplementation(async (opts) => {
              if (opts.where?.invoiceId === 'inv-1') return mockInvoice;
              return null;
            }),
          },
        },
        {
          provide: EventService,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ComplianceService);
    ewayBillRepo = module.get(getRepositoryToken(EwayBill));
    gstrRepo = module.get(getRepositoryToken(GstrFiling));
    invoiceRepo = module.get(getRepositoryToken(Invoice));
    eventService = module.get(EventService);
  });

  describe('createEwayBill', () => {
    it('should throw if invoice not found', async () => {
      (invoiceRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.createEwayBill({ invoiceId: 'inv-X', ewbNumber: 'EWB123' } as any, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw if ewbNumber exists', async () => {
      await expect(service.createEwayBill({ invoiceId: 'inv-1', ewbNumber: 'EWB123' } as any, mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should create eway bill', async () => {
      (ewayBillRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.createEwayBill({ invoiceId: 'inv-1', ewbNumber: 'NEW123' } as any, mockUser);
      expect(result.ewbId).toBeDefined();
      expect(eventService.emit).toHaveBeenCalled();
    });
  });

  describe('getEwayBillByInvoice', () => {
    it('should throw if invoice not found', async () => {
      (invoiceRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.getEwayBillByInvoice('inv-X')).rejects.toThrow(NotFoundException);
    });

    it('should return bills', async () => {
      const result = await service.getEwayBillByInvoice('inv-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateEwayBill', () => {
    it('should throw if bill not found', async () => {
      (ewayBillRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.updateEwayBill('ewb-X', {}, mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should update bill', async () => {
      const result = await service.updateEwayBill('ewb-1', { ewbNumber: 'UPDATED' }, mockUser);
      expect(result.ewbNumber).toBe('UPDATED');
      expect(eventService.emit).toHaveBeenCalled();
    });
  });

  describe('generateGstr', () => {
    it('should throw if filing exists', async () => {
      await expect(service.generateGstr({ type: 'GSTR1', period: '2025-09' } as any, 'org-123', mockUser)).rejects.toThrow(BadRequestException);
    });

    it('should create filing', async () => {
      (gstrRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      const result = await service.generateGstr({ type: 'GSTR1', period: '2025-09' } as any, 'org-123', mockUser);
      expect(result.filingId).toBeDefined();
      expect(eventService.emit).toHaveBeenCalled();
    });
  });

  describe('getGstrFilings', () => {
    it('should return filings', async () => {
      const result = await service.getGstrFilings('org-123');
      expect(result).toHaveLength(1);
    });
  });

  describe('updateGstrFiling', () => {
    it('should throw if filing not found', async () => {
      (gstrRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
      await expect(service.updateGstrFiling('filing-X', GstrFilingStatus.FILED, {}, new Date(), mockUser)).rejects.toThrow(NotFoundException);
    });

    it('should update filing', async () => {
      const result = await service.updateGstrFiling('filing-1', GstrFilingStatus.FILED, {}, new Date(), mockUser);
      expect(result.status).toBe(GstrFilingStatus.FILED);
      expect(eventService.emit).toHaveBeenCalled();
    });
  });
});
