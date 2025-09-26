// src/modules/products-services/products-services.controller.ts
import { Controller, Get, Post, Patch, Param, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsServicesService } from './products-services.service';
import {
  CreateProductServiceDto,
  UpdateProductServiceDto,
  ProductServiceResponseDto,
} from './dto/product-service.dto';

@ApiTags('Products/Services')
@Controller('products-services')
export class ProductsServicesController {
  constructor(private readonly service: ProductsServicesService) {}

  // -------------------- Create Product/Service --------------------
  @Post()
  @ApiOperation({ summary: 'Create a new product/service' })
  @ApiResponse({ status: 201, description: 'Product/Service created', type: ProductServiceResponseDto })
  async create(@Body() dto: CreateProductServiceDto): Promise<ProductServiceResponseDto> {
    return this.service.createProductService(dto);
  }

  // -------------------- Get All Products/Services --------------------
  @Get()
  @ApiOperation({ summary: 'Get all products/services' })
  @ApiResponse({ status: 200, description: 'List of products/services', type: [ProductServiceResponseDto] })
  async getAll(): Promise<ProductServiceResponseDto[]> {
    return this.service.getAllProductServices();
  }

  // -------------------- Get Product/Service By ID --------------------
  @Get(':id')
  @ApiOperation({ summary: 'Get a product/service by ID' })
  @ApiParam({ name: 'id', description: 'Product/Service ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Product/Service details', type: ProductServiceResponseDto })
  async getById(@Param('id') id: string): Promise<ProductServiceResponseDto> {
    return this.service.getProductServiceById(id);
  }

  // -------------------- Update Product/Service --------------------
  @Patch(':id')
  @ApiOperation({ summary: 'Update a product/service partially' })
  @ApiParam({ name: 'id', description: 'Product/Service ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Updated product/service details', type: ProductServiceResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductServiceDto,
  ): Promise<ProductServiceResponseDto> {
    return this.service.updateProductService(id, dto);
  }
}
