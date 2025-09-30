import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceResponseDto,
  InvoiceQueryDto,
} from './dto/invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, OrganizationParam } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums'; // ✅ unified import
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@ApiBearerAuth('access-token')
@Controller('organizations/:orgId/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

  constructor(private readonly invoicesService: InvoicesService) {}

  // -------------------- Create Invoice --------------------
  @Post()
  @OrganizationParam('orgId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Invoice successfully created',
    type: InvoiceResponseDto,
  })
  async create(
    @Param('orgId') orgId: string,
    @Body() createInvoiceDto: CreateInvoiceDto,
    @CurrentUser() user: RequestUser,
  ): Promise<InvoiceResponseDto> {
    this.logger.log(`User ${user.userId} creating invoice for org ${orgId}`);
    return this.invoicesService.create(orgId, createInvoiceDto);
  }

  // -------------------- List Invoices --------------------
  @Get()
  @OrganizationParam('orgId')
  @Roles(UserRole.VIEWER, UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.SALES)
  @ApiOperation({ summary: 'List invoices with filters & pagination' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'partnerId', required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoices retrieved successfully',
    type: [InvoiceResponseDto],
  })
  async findAll(
    @Param('orgId') orgId: string,
    @Query() query: InvoiceQueryDto,
  ): Promise<InvoiceResponseDto[]> {
    const result = await this.invoicesService.findAll(orgId, query);
    return result.data;
  }

  // -------------------- Get Invoice by ID --------------------
  @Get(':invoiceId')
  @OrganizationParam('orgId')
  @Roles(UserRole.VIEWER, UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.SALES)
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice retrieved successfully',
    type: InvoiceResponseDto,
  })
  async findOne(
    @Param('orgId') orgId: string,
    @Param('invoiceId') invoiceId: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicesService.findOne(orgId, invoiceId);
  }

  // -------------------- Update Invoice --------------------
  @Patch(':invoiceId')
  @OrganizationParam('orgId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Update a draft invoice' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice updated successfully',
    type: InvoiceResponseDto,
  })
  async update(
    @Param('orgId') orgId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    this.logger.log(`Updating invoice ${invoiceId} in org ${orgId}`);
    return this.invoicesService.update(orgId, invoiceId, updateInvoiceDto);
  }

  // -------------------- Send Invoice --------------------
  @Post(':invoiceId/send')
  @OrganizationParam('orgId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Mark a draft invoice as sent' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice sent successfully',
    type: InvoiceResponseDto,
  })
  async sendInvoice(
    @Param('orgId') orgId: string,
    @Param('invoiceId') invoiceId: string,
  ): Promise<InvoiceResponseDto> {
    this.logger.log(`Sending invoice ${invoiceId} in org ${orgId}`);
    return this.invoicesService.sendInvoice(orgId, invoiceId);
  }

  // -------------------- Void Invoice --------------------
  @Post(':invoiceId/void')
  @OrganizationParam('orgId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Void an invoice (unless already paid)' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invoice voided successfully',
  })
  async voidInvoice(
    @Param('orgId') orgId: string,
    @Param('invoiceId') invoiceId: string,
  ): Promise<void> {
    this.logger.log(`Voiding invoice ${invoiceId} in org ${orgId}`);
    return this.invoicesService.voidInvoice(orgId, invoiceId);
  }
}
