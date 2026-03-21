import { Test, TestingModule } from '@nestjs/testing';
import { ProductsServicesService } from './products-services.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsServices } from '../../entities/products-services.entity';
import { Repository } from 'typeorm';
import { EventService } from '../event/event.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../../common/enums';
import { RequestUser } from '../../common/interfaces/auth.interface';

const mockRepo = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockEventService = () => ({
  emit: jest.fn(),
});

describe('ProductsServicesService', () => {
  let service: ProductsServicesService;
  let repo: jest.Mocked<Repository<ProductsServices>>;
  let eventService: jest.Mocked<EventService>;

  const orgId = 'org-123';
  const superAdminUser: RequestUser = {
    userId: 'super-1',
    email: 'superadmin@example.com',
    role: UserRole.SUPER_ADMIN,
    organizationId: '',
    workspaceId: 'ws-1',
    roles: [UserRole.SUPER_ADMIN],
  };
  const normalUser: RequestUser = {
    userId: 'user-1',
    email: 'user@example.com',
    role: UserRole.FINANCE_MANAGER,
    organizationId: orgId,
    workspaceId: 'ws-1',
    roles: [UserRole.FINANCE_MANAGER],
  };
  const wrongOrgUser: RequestUser = {
    userId: 'user-2',
    email: 'user2@example.com',
    role: UserRole.FINANCE_MANAGER,
    organizationId: 'org-999',
    workspaceId: 'ws-1',
    roles: [UserRole.FINANCE_MANAGER],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsServicesService,
        { provide: getRepositoryToken(ProductsServices), useFactory: mockRepo },
        { provide: EventService, useFactory: mockEventService },
      ],
    }).compile();

    service = module.get(ProductsServicesService);
    repo = module.get(getRepositoryToken(ProductsServices));
    eventService = module.get(EventService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a new product/service', async () => {
    const dto = { name: 'Laptop', unitPrice: 50000, gstRatePercent: 18 };
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(dto as any);
    repo.save.mockResolvedValue({ productId: 'p1', organizationId: orgId, ...dto } as any);

    const result = await service.createProductService(dto as any, normalUser, orgId);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { name: dto.name, organizationId: orgId } });
    expect(repo.create).toHaveBeenCalledWith({ ...dto, organizationId: orgId });
    expect(repo.save).toHaveBeenCalled();
    expect(eventService.emit).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ name: 'Laptop' }));
  });

  it('should allow SUPER_ADMIN to create in any org', async () => {
    const dto = { name: 'Server', unitPrice: 80000, gstRatePercent: 18 };
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(dto as any);
    repo.save.mockResolvedValue({ productId: 'p2', organizationId: 'org-999', ...dto } as any);

    const result = await service.createProductService(dto as any, superAdminUser, 'org-999');

    expect(result).toEqual(expect.objectContaining({ name: 'Server' }));
  });

  it('should throw ForbiddenException if user org does not match', async () => {
    const dto = { name: 'Laptop' };
    await expect(service.createProductService(dto as any, wrongOrgUser, orgId)).rejects.toThrow(ForbiddenException);
  });

  it('should throw if product name already exists', async () => {
    repo.findOne.mockResolvedValue({ productId: 'p1', name: 'Laptop', organizationId: orgId } as any);

    await expect(service.createProductService({ name: 'Laptop' } as any, normalUser, orgId)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should get a product by id', async () => {
    const product = { productId: 'p1', name: 'Mouse', organizationId: orgId };
    repo.findOne.mockResolvedValue(product as any);

    const result = await service.getProductServiceById('p1', normalUser, orgId);

    expect(result).toEqual(expect.objectContaining({ name: 'Mouse' }));
  });

  it('should throw if product not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.getProductServiceById('wrong', normalUser, orgId)).rejects.toThrow(NotFoundException);
  });

  it('should update a product', async () => {
    const product = { productId: 'p1', name: 'Keyboard', organizationId: orgId } as any;
    repo.findOne.mockResolvedValue(product);
    repo.save.mockResolvedValue({ ...product, name: 'Keyboard Pro' });

    const result = await service.updateProductService('p1', { name: 'Keyboard Pro' } as any, normalUser, orgId);

    expect(repo.save).toHaveBeenCalled();
    expect(eventService.emit).toHaveBeenCalled();
    expect(result.name).toBe('Keyboard Pro');
  });

  it('should return all products for the org', async () => {
    repo.find.mockResolvedValue([
      { productId: 'p1', name: 'Laptop', organizationId: orgId },
      { productId: 'p2', name: 'Mouse', organizationId: orgId },
    ] as any);

    const result = await service.getAllProductServices(normalUser, orgId);

    expect(result).toHaveLength(2);
  });
});
