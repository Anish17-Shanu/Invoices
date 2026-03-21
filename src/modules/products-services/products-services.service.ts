import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
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
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

@Injectable()
export class ProductsServicesService {
  private readonly logger = new Logger(ProductsServicesService.name);

  constructor(
    @InjectRepository(ProductsServices)
    private readonly productServiceRepo: Repository<ProductsServices>,
    private readonly eventService: EventService,
  ) {}

  // -------------------- Create Product/Service --------------------
  async createProductService(
    dto: CreateProductsServicesDto,
    user: RequestUser,
    orgId: string,
  ): Promise<ProductServiceResponseDto> {
    this.checkOrgAccess(user, orgId);

    const existing = await this.productServiceRepo.findOne({ where: { name: dto.name, organizationId: orgId } });
    if (existing) throw new BadRequestException('Product/Service with this name already exists');

    const product = this.productServiceRepo.create({ ...dto, organizationId: orgId });
    await this.productServiceRepo.save(product);

    this.logger.log(`User ${user.userId} created Product/Service: ${product.name} in org ${orgId}`);

    this.eventService.emit(AppEvent.PRODUCT_SERVICE_CREATED, {
      productId: product.productId,
      organizationId: orgId,
      name: product.name,
    });

    return this.toResponseDto(product);
  }

  // -------------------- Get Product/Service by ID --------------------
  async getProductServiceById(
    productId: string,
    user: RequestUser,
    orgId: string,
  ): Promise<ProductServiceResponseDto> {
    this.checkOrgAccess(user, orgId);

    const product = await this.productServiceRepo.findOne({ where: { productId, organizationId: orgId } });
    if (!product) throw new NotFoundException('Product/Service not found');

    return this.toResponseDto(product);
  }

  // -------------------- Update Product/Service --------------------
  async updateProductService(
    productId: string,
    dto: UpdateProductServiceDto,
    user: RequestUser,
    orgId: string,
  ): Promise<ProductServiceResponseDto> {
    this.checkOrgAccess(user, orgId);

    const product = await this.productServiceRepo.findOne({ where: { productId, organizationId: orgId } });
    if (!product) throw new NotFoundException('Product/Service not found');

    Object.assign(product, dto);
    await this.productServiceRepo.save(product);

    this.logger.log(`User ${user.userId} updated Product/Service: ${product.name} in org ${orgId}`);

    this.eventService.emit(AppEvent.PRODUCT_SERVICE_UPDATED, {
      productId: product.productId,
      organizationId: orgId,
      name: product.name,
    });

    return this.toResponseDto(product);
  }

  // -------------------- Get All Products/Services --------------------
  async getAllProductServices(user: RequestUser, orgId: string): Promise<ProductServiceResponseDto[]> {
    this.checkOrgAccess(user, orgId);

    const products = await this.productServiceRepo.find({ where: { organizationId: orgId }, order: { name: 'ASC' } });
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

  // -------------------- Helper: Check User Access --------------------
  private checkOrgAccess(user: RequestUser, orgId: string) {
    if (user.role === UserRole.SUPER_ADMIN) return; // full access
    if (user.organizationId !== orgId) throw new ForbiddenException('Insufficient permissions');
  }
}
