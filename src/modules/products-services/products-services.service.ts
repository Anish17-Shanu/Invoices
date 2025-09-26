import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from '../../entities/product-service.entity';
import {
  CreateProductServiceDto,
  UpdateProductServiceDto,
  ProductServiceResponseDto,
} from './dto/product-service.dto';
import { EventService } from '../event/event.service';
import { AppEvent } from '../../common/enums/app-event.enum';

@Injectable()
export class ProductsServicesService {
  constructor(
    @InjectRepository(ProductService)
    private readonly productServiceRepo: Repository<ProductService>,
    private readonly eventService: EventService, // Inject EventService
  ) {}

  // -------------------- Create Product/Service --------------------
  async createProductService(dto: CreateProductServiceDto): Promise<ProductServiceResponseDto> {
    const existing = await this.productServiceRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('Product/Service with this name already exists');

    const product = this.productServiceRepo.create(dto);
    await this.productServiceRepo.save(product);

    // 🔹 Emit event after creation
    this.eventService.emit(AppEvent.PRODUCT_SERVICE_CREATED, {
      productId: product.productId,
      organizationId: product.organizationId,
      name: product.name,
    });

    return this.toResponseDto(product);
  }

  // -------------------- Get Product/Service by ID --------------------
  async getProductServiceById(productId: string): Promise<ProductServiceResponseDto> {
    const product = await this.productServiceRepo.findOne({ where: { productId } });
    if (!product) throw new NotFoundException('Product/Service not found');
    return this.toResponseDto(product);
  }

  // -------------------- Update Product/Service --------------------
  async updateProductService(
    productId: string,
    dto: UpdateProductServiceDto,
  ): Promise<ProductServiceResponseDto> {
    const product = await this.productServiceRepo.findOne({ where: { productId } });
    if (!product) throw new NotFoundException('Product/Service not found');

    Object.assign(product, dto);
    await this.productServiceRepo.save(product);

    // 🔹 Emit event after update
    this.eventService.emit(AppEvent.PRODUCT_SERVICE_UPDATED, {
      productId: product.productId,
      organizationId: product.organizationId,
      name: product.name,
    });

    return this.toResponseDto(product);
  }

  // -------------------- Get All Products/Services --------------------
  async getAllProductServices(): Promise<ProductServiceResponseDto[]> {
    const products = await this.productServiceRepo.find({ order: { name: 'ASC' } });
    return products.map(this.toResponseDto);
  }

  // -------------------- Helper: Map Entity to Response DTO --------------------
  private toResponseDto(product: ProductService): ProductServiceResponseDto {
    return {
      productId: product.productId,
      organizationId: product.organizationId,
      name: product.name,
      description: product.description,
      hsnSacCode: product.hsnSacCode,
      unitPrice: product.unitPrice,
      gstRatePercent: product.gstRatePercent,
      isActive: product.isActive,
    };
  }
}
