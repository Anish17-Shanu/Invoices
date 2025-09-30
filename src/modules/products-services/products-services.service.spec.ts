import { Test, TestingModule } from '@nestjs/testing';
import { ProductsServicesService } from './products-services.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsServices } from '../../entities/products-services.entity';
import { Repository } from 'typeorm';
import { EventService } from '../event/event.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
    repo.save.mockResolvedValue({ productId: 'p1', ...dto } as any);

    const result = await service.createProductService(dto as any);

    expect(repo.findOne).toHaveBeenCalledWith({ where: { name: dto.name } });
    expect(repo.create).toHaveBeenCalledWith(dto);
    expect(repo.save).toHaveBeenCalled();
    expect(eventService.emit).toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ name: 'Laptop' }));
  });

  it('should throw if product name already exists', async () => {
    repo.findOne.mockResolvedValue({ productId: 'p1', name: 'Laptop' } as any);

    await expect(service.createProductService({ name: 'Laptop' } as any)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should get a product by id', async () => {
    const product = { productId: 'p1', name: 'Mouse' };
    repo.findOne.mockResolvedValue(product as any);

    const result = await service.getProductServiceById('p1');

    expect(result).toEqual(expect.objectContaining({ name: 'Mouse' }));
  });

  it('should throw if product not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.getProductServiceById('wrong')).rejects.toThrow(NotFoundException);
  });

  it('should update a product', async () => {
    const product = { productId: 'p1', name: 'Keyboard' } as any;
    repo.findOne.mockResolvedValue(product);
    repo.save.mockResolvedValue({ ...product, name: 'Keyboard Pro' });

    const result = await service.updateProductService('p1', { name: 'Keyboard Pro' } as any);

    expect(repo.save).toHaveBeenCalled();
    expect(eventService.emit).toHaveBeenCalled();
    expect(result.name).toBe('Keyboard Pro');
  });

  it('should return all products', async () => {
    repo.find.mockResolvedValue([
      { productId: 'p1', name: 'Laptop' },
      { productId: 'p2', name: 'Mouse' },
    ] as any);

    const result = await service.getAllProductServices();

    expect(result).toHaveLength(2);
  });
});
