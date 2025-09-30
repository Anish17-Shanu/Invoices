import { Test, TestingModule } from '@nestjs/testing';
import { ProductsServicesController } from './products-services.controller';
import { ProductsServicesService } from './products-services.service';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

describe('ProductsServicesController', () => {
  let controller: ProductsServicesController;
  let service: ProductsServicesService;

  const mockService = {
    createProductService: jest.fn(),
    getAllProductServices: jest.fn(),
    getProductServiceById: jest.fn(),
    updateProductService: jest.fn(),
  };

  // ✅ Complete mock user to satisfy RequestUser
  const mockUser: RequestUser = {
    userId: 'u1',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN],
    workspaceId: 'ws-1',
    organizationId: 'org-1',
    name: 'Test User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsServicesController],
      providers: [{ provide: ProductsServicesService, useValue: mockService }],
    }).compile();

    controller = module.get(ProductsServicesController);
    service = module.get(ProductsServicesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a product', async () => {
    const dto = { name: 'Laptop' } as any;
    mockService.createProductService.mockResolvedValue({ productId: 'p1', ...dto });

    const result = await controller.create(dto, mockUser);

    expect(service.createProductService).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expect.objectContaining({ name: 'Laptop' }));
  });

  it('should get all products', async () => {
    mockService.getAllProductServices.mockResolvedValue([{ productId: 'p1', name: 'Mouse' }]);

    const result = await controller.getAll();

    expect(service.getAllProductServices).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('should get a product by id', async () => {
    mockService.getProductServiceById.mockResolvedValue({ productId: 'p1', name: 'Keyboard' });

    const result = await controller.getById('p1');

    expect(service.getProductServiceById).toHaveBeenCalledWith('p1');
    expect(result).toEqual(expect.objectContaining({ name: 'Keyboard' }));
  });

  it('should update a product', async () => {
    mockService.updateProductService.mockResolvedValue({ productId: 'p1', name: 'Updated' });

    const result = await controller.update('p1', { name: 'Updated' } as any, mockUser);

    expect(service.updateProductService).toHaveBeenCalledWith('p1', { name: 'Updated' });
    expect(result).toEqual(expect.objectContaining({ name: 'Updated' }));
  });
});
