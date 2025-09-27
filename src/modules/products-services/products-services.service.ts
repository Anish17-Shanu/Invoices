import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsServices } from '../../entities/products-services.entity';
import {
  CreateProductsServicesDto,
  UpdateProductServiceDto,
  ProductServiceResponseDto,
} from './dto/products-services.dto';
import { EventService } from '../event/event.service';
import { AppEvent } from '../../common/enums/app-event.enum';

@Injectable()
export class ProductsServicesService {
  private readonly logger = new Logger(ProductsServicesService.name);

  constructor(
    @InjectRepository(ProductsServices)
    private readonly productServiceRepo: Repository<ProductsServices>,
    private readonly eventService: EventService,
  ) {}

  // -------------------- Create Product/Service --------------------
  async createProductService(dto: CreateProductsServicesDto): Promise<ProductServiceResponseDto> {
    const existing = await this.productServiceRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new BadRequestException('Product/Service with this name already exists');

    const product = this.productServiceRepo.create(dto);
    await this.productServiceRepo.save(product);

    this.logger.log(`Created Product/Service: ${product.name}`);

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

    this.logger.log(`Updated Product/Service: ${product.name}`);

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
  private toResponseDto(product: ProductsServices): ProductServiceResponseDto {
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
