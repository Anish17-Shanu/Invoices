import { Test, TestingModule } from '@nestjs/testing';
import { BusinessPartnersService } from './business-partners.service';
import { Repository } from 'typeorm';
import { BusinessPartner } from '../../entities/business-partner.entity';
import { Invoice } from '../../entities/invoice.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventService } from '../event/event.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

describe('BusinessPartnersService', () => {
  let service: BusinessPartnersService;
  let partnersRepo: Repository<BusinessPartner>;
  let invoicesRepo: Repository<Invoice>;
  let eventService: EventService;

  const mockUser: RequestUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    organizationId: 'org-123',
    workspaceId: 'workspace-123',
    roles: [UserRole.ADMIN],
  };

  const mockPartner: BusinessPartner = {
    partnerId: 'partner-1',
    organizationId: 'org-123',
    name: 'Test Partner',
    type: 'vendor',
    gstin: null,
    pan: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessPartnersService,
        {
          provide: getRepositoryToken(BusinessPartner),
          useValue: {
            findOne: jest.fn().mockImplementation(async (opts) => {
              if (opts.where?.gstin === '123' || opts.where?.pan === 'PAN123') return mockPartner;
              if (opts.where?.partnerId === 'partner-1') return mockPartner;
              return null;
            }),
            find: jest.fn().mockResolvedValue([mockPartner]),
            create: jest.fn().mockReturnValue(mockPartner),
            save: jest.fn().mockImplementation(async (partner) => ({ ...mockPartner, ...partner })),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: { find: jest.fn().mockResolvedValue([]) },
        },
        {
          provide: EventService,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(BusinessPartnersService);
    partnersRepo = module.get(getRepositoryToken(BusinessPartner));
    invoicesRepo = module.get(getRepositoryToken(Invoice));
    eventService = module.get(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a partner successfully', async () => {
      const result = await service.create({ name: 'New Partner', type: 'vendor' } as any, mockUser);
      expect(result.partnerId).toBeDefined();
      expect(eventService.emit).toHaveBeenCalled();
    });

    it('should throw if GSTIN exists', async () => {
      await expect(
        service.create({ name: 'Partner', gstin: '123' } as any, mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if PAN exists', async () => {
      await expect(
        service.create({ name: 'Partner', pan: 'PAN123' } as any, mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return partners list', async () => {
      const result = await service.findAll({ page: 1, limit: 10 } as any, mockUser);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return partner if found', async () => {
      const result = await service.findOne('partner-1', mockUser);
      expect(result.partnerId).toBe('partner-1');
    });

    it('should throw if partner not found', async () => {
      await expect(service.findOne('unknown', mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update partner', async () => {
      const result = await service.update('partner-1', { name: 'Updated' } as any, mockUser);
      expect(result.name).toBe('Updated');
    });

    it('should throw if partner not found', async () => {
      await expect(service.update('unknown', { name: 'X' } as any, mockUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove partner', async () => {
      const result = await service.remove('partner-1', mockUser);
      expect(result).toBeUndefined();
    });

    it('should throw if partner not found', async () => {
      await expect(service.remove('unknown', mockUser)).rejects.toThrow(NotFoundException);
    });
  });
});
