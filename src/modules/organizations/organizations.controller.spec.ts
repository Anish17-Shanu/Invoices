// src/modules/organizations/organizations.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { Organization } from '../../entities/organization.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ExecutionContext } from '@nestjs/common';

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let service: jest.Mocked<OrganizationsService>;

  // Mock guards: always allow
  const mockGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
    service = module.get(OrganizationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'Test Org', gstin: 'GST123', pan: 'PAN123' } as any;

      const org: Organization = {
        organizationId: '1',
        name: 'Test Org',
        gstin: 'GST123',
        pan: 'PAN123',
        type: 'Private',
        users: [],
        businessPartners: [],
        productsServices: [],
        invoices: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      service.create.mockResolvedValue(org);

      const result = await controller.create(dto);

      expect(result).toEqual(org);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll', async () => {
      const query = { sortBy: 'createdAt', sortOrder: 'DESC', page: 1, limit: 10 } as any;

      const res = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };

      service.findAll.mockResolvedValue(res as any);

      const result = await controller.findAll(query);
      expect(result).toEqual(res);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      const org: Organization = {
        organizationId: '1',
        name: 'Org1',
        gstin: 'GST123',
        pan: 'PAN123',
        type: 'Private',
        users: [],
        businessPartners: [],
        productsServices: [],
        invoices: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      service.findOne.mockResolvedValue(org);

      const result = await controller.findOne('1');
      expect(result).toEqual(org);
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const org: Organization = {
        organizationId: '1',
        name: 'Updated',
        gstin: 'GST123',
        pan: 'PAN123',
        type: 'Private',
        users: [],
        businessPartners: [],
        productsServices: [],
        invoices: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;

      service.update.mockResolvedValue(org);

      const result = await controller.update('1', { name: 'Updated' } as any);
      expect(result).toEqual(org);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('1');
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
