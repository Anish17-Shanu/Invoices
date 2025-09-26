// src/modules/organizations/organizations.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationsService } from './organizations.service';
import { Organization } from '../../entities/organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationQueryDto } from './dto/organization.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { EventService } from '../event/event.service';
import { AppEvent } from '../../common/enums/app-event.enum';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repository: jest.Mocked<Repository<Organization>>;
  let eventService: { emit: jest.Mock };

  const mockOrganization: Organization = {
    organizationId: '123e4567-e89b-12d3-a456-426614174000',
    workspaceId: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Organization',
    legalName: 'Test Organization Ltd.',
    gstin: '12ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '123456',
      country: 'India',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    // relations (empty for test)
    users: [],
    businessPartners: [],
    productsServices: [],
    invoices: [],
    payments: [],
    gstrFilings: [],
    type: null,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    eventService = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository,
        },
        {
          provide: EventService,
          useValue: eventService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    repository = module.get(getRepositoryToken(Organization));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateOrganizationDto = {
      name: 'Test Organization',
      gstin: '12ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
    };

    it('should create a new organization and emit event', async () => {
      mockRepository.create.mockReturnValue(mockOrganization);
      mockRepository.save
        .mockResolvedValueOnce({ ...mockOrganization, workspaceId: null }) // first save without workspaceId
        .mockResolvedValueOnce(mockOrganization); // second save with workspaceId

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(eventService.emit).toHaveBeenCalledWith(AppEvent.PARTNER_CREATED, {
        organizationId: mockOrganization.organizationId,
        workspaceId: mockOrganization.workspaceId,
        name: mockOrganization.name,
      });
      expect(result).toEqual(mockOrganization);
    });

    it('should throw ConflictException if GSTIN already exists', async () => {
      const error = { code: '23505', constraint: 'organizations_gstin_key' };
      mockRepository.create.mockReturnValue(mockOrganization);
      mockRepository.save.mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated organizations', async () => {
      const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockOrganization], 1]),
      };
      mockRepository.createQueryBuilder.mockReturnValue(qb);

      const query: OrganizationQueryDto = {
        page: 1, limit: 10,
        sortBy: '',
        sortOrder: 'DESC'
      };
      const result = await service.findAll(query);

      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(result.data).toEqual([mockOrganization]);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return an organization if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrganization);

      const result = await service.findOne(mockOrganization.organizationId);

      expect(result).toEqual(mockOrganization);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { organizationId: mockOrganization.organizationId },
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByWorkspace', () => {
    it('should return organizations for a workspace', async () => {
      mockRepository.find.mockResolvedValue([mockOrganization]);

      const result = await service.findByWorkspace(mockOrganization.workspaceId);

      expect(result).toEqual([mockOrganization]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { workspaceId: mockOrganization.workspaceId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateOrganizationDto = { name: 'Updated Org' };

    it('should update organization and emit event', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrganization);
      mockRepository.save.mockResolvedValue({
        ...mockOrganization,
        ...updateDto,
      });

      const result = await service.update(mockOrganization.organizationId, updateDto);

      expect(mockRepository.findOne).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(eventService.emit).toHaveBeenCalledWith(AppEvent.PARTNER_UPDATED, {
        organizationId: mockOrganization.organizationId,
        name: 'Updated Org',
      });
      expect(result.name).toBe('Updated Org');
    });

    it('should throw ConflictException on unique constraint violation', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrganization);
      const error = { code: '23505', constraint: 'organizations_gstin_key' };
      mockRepository.save.mockRejectedValue(error);

      await expect(service.update(mockOrganization.organizationId, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('should delete successfully', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(mockOrganization.organizationId);

      expect(mockRepository.delete).toHaveBeenCalledWith(mockOrganization.organizationId);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
