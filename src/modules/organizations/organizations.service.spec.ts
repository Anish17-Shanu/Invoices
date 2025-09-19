import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationsService } from './organizations.service';
import { Organization } from '../../entities/organization.entity';
import { CreateOrganizationDto } from './dto/organization.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repository: Repository<Organization>;

  const mockOrganization = {
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
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    repository = module.get<Repository<Organization>>(getRepositoryToken(Organization));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateOrganizationDto = {
      workspaceId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Test Organization',
      gstin: '12ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
    };

    it('should create a new organization', async () => {
      mockRepository.create.mockReturnValue(mockOrganization);
      mockRepository.save.mockResolvedValue(mockOrganization);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockOrganization);
      expect(result).toEqual(mockOrganization);
    });

    it('should throw ConflictException if GSTIN already exists', async () => {
      const error = { code: '23505', constraint: 'organizations_gstin_key' };
      mockRepository.create.mockReturnValue(mockOrganization);
      mockRepository.save.mockRejectedValue(error);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return an organization if found', async () => {
      mockRepository.findOne.mockResolvedValue(mockOrganization);

      const result = await service.findOne('123e4567-e89b-12d3-a456-426614174000');

      expect(result).toEqual(mockOrganization);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { organizationId: '123e4567-e89b-12d3-a456-426614174000' },
      });
    });

    it('should throw NotFoundException if organization not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByWorkspace', () => {
    it('should return organizations for a workspace', async () => {
      const organizations = [mockOrganization];
      mockRepository.find.mockResolvedValue(organizations);

      const result = await service.findByWorkspace('123e4567-e89b-12d3-a456-426614174001');

      expect(result).toEqual(organizations);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { workspaceId: '123e4567-e89b-12d3-a456-426614174001' },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
