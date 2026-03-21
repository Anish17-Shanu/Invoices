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
import { PartnerType } from '../../common/enums/partner-type.enum';
import { CreateBusinessPartnerDto, UpdateBusinessPartnerDto, BusinessPartnerQueryDto } from './dto/business-partner.dto';

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
    type: PartnerType.VENDOR,
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
      const dto: CreateBusinessPartnerDto = { name: 'New Partner', type: PartnerType.VENDOR };
      const result = await service.create(dto, mockUser, mockUser.organizationId);
      expect(result.partnerId).toBeDefined();
      expect(eventService.emit).toHaveBeenCalled();
    });

    it('should throw if GSTIN exists', async () => {
      const dto: CreateBusinessPartnerDto = { name: 'Partner', gstin: '123', type: PartnerType.VENDOR };
      await expect(service.create(dto, mockUser, mockUser.organizationId)).rejects.toThrow(BadRequestException);
    });

    it('should throw if PAN exists', async () => {
      const dto: CreateBusinessPartnerDto = { name: 'Partner', pan: 'PAN123', type: PartnerType.VENDOR };
      await expect(service.create(dto, mockUser, mockUser.organizationId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return partners list', async () => {
      const query: BusinessPartnerQueryDto = { page: 1, limit: 10, type: PartnerType.VENDOR };
      const result = await service.findAll(query, mockUser, mockUser.organizationId);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return partner if found', async () => {
      const result = await service.findOne('partner-1', mockUser, mockUser.organizationId);
      expect(result.partnerId).toBe('partner-1');
    });

    it('should throw if partner not found', async () => {
      await expect(service.findOne('unknown', mockUser, mockUser.organizationId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update partner', async () => {
      const dto: UpdateBusinessPartnerDto = { name: 'Updated', type: PartnerType.VENDOR };
      const result = await service.update('partner-1', dto, mockUser, mockUser.organizationId);
      expect(result.name).toBe('Updated');
    });

    it('should throw if partner not found', async () => {
      const dto: UpdateBusinessPartnerDto = { name: 'X', type: PartnerType.VENDOR };
      await expect(service.update('unknown', dto, mockUser, mockUser.organizationId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove partner', async () => {
      const result = await service.remove('partner-1', mockUser, mockUser.organizationId);
      expect(result).toBeUndefined();
    });

    it('should throw if partner not found', async () => {
      await expect(service.remove('unknown', mockUser, mockUser.organizationId)).rejects.toThrow(NotFoundException);
    });
  });
});
