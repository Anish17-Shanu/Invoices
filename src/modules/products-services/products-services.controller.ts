import { 
  Controller, Get, Post, Patch, Param, Body, UseGuards, HttpStatus, Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsServicesService } from './products-services.service';
import {
  CreateProductsServicesDto,
  UpdateProductServiceDto,
  ProductServiceResponseDto,
} from './dto/products-services.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

@ApiTags('Products & Services')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/products-services') // ✅ nested under organization
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ ensures JWT + roles are checked
export class ProductsServicesController {
  private readonly logger = new Logger(ProductsServicesController.name);

  constructor(private readonly service: ProductsServicesService) {}

  // -------------------- Create Product/Service --------------------
  @Post()
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new product/service' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Product/Service created', type: ProductServiceResponseDto })
  async create(
    @Param('orgId') orgId: string,
    @Body() dto: CreateProductsServicesDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ProductServiceResponseDto> {
    this.logger.log(`User ${user.userId} creating product/service in org ${orgId}: ${dto.name}`);
    return this.service.createProductService(dto, user, orgId);
  }

  // -------------------- Get All products & services --------------------
  @Get()
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all products & services' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of products & services', type: [ProductServiceResponseDto] })
  async getAll(
    @Param('orgId') orgId: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ProductServiceResponseDto[]> {
    return this.service.getAllProductServices(user, orgId);
  }

  // -------------------- Get Product/Service By ID --------------------
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a product/service by ID' })
  @ApiParam({ name: 'id', description: 'Product/Service ID', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product/Service details', type: ProductServiceResponseDto })
  async getById(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ): Promise<ProductServiceResponseDto> {
    return this.service.getProductServiceById(id, user, orgId);
  }

  // -------------------- Update Product/Service --------------------
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a product/service partially' })
  @ApiParam({ name: 'id', description: 'Product/Service ID', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated product/service details', type: ProductServiceResponseDto })
  async update(
    @Param('orgId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductServiceDto,
    @CurrentUser() user: RequestUser,
  ): Promise<ProductServiceResponseDto> {
    this.logger.log(`User ${user.userId} updating product/service ${id} in org ${orgId}`);
    return this.service.updateProductService(id, dto, user, orgId);
  }
}
