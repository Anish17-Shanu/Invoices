import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import {
  CreateEwayBillDto,
  EwayBillResponseDto,
  GenerateGstrDto,
  GstrFilingResponseDto,
} from './dto/compliance.dto';
import { GstrFilingStatus } from '../../entities/gstr-filing.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

@ApiTags('Compliance')
@ApiBearerAuth('access-token')
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ JWT auth + role-based access
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  // -------------------- E-WAY BILL --------------------

  @Post('eway-bill')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Create a new E-Way Bill for an invoice' })
  @ApiBody({ type: CreateEwayBillDto })
  @ApiResponse({ status: 201, description: 'E-Way Bill created', type: EwayBillResponseDto })
  async createEwayBill(
    @Body() dto: CreateEwayBillDto,
    @CurrentUser() user: RequestUser,
  ): Promise<EwayBillResponseDto> {
    return this.complianceService.createEwayBill(dto, user);
  }

  @Get('eway-bill/invoice/:invoiceId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all E-Way Bills for a given invoice' })
  @ApiParam({ name: 'invoiceId', type: String })
  @ApiResponse({ status: 200, description: 'List of E-Way Bills', type: [EwayBillResponseDto] })
  async getEwayBillsByInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ): Promise<EwayBillResponseDto[]> {
    return this.complianceService.getEwayBillByInvoice(invoiceId);
  }

  @Patch('eway-bill/:ewbId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Update an existing E-Way Bill' })
  @ApiParam({ name: 'ewbId', type: String })
  @ApiBody({ type: CreateEwayBillDto })
  @ApiResponse({ status: 200, description: 'Updated E-Way Bill', type: EwayBillResponseDto })
  async updateEwayBill(
    @Param('ewbId', ParseUUIDPipe) ewbId: string,
    @Body() dto: Partial<CreateEwayBillDto>,
    @CurrentUser() user: RequestUser,
  ): Promise<EwayBillResponseDto> {
    return this.complianceService.updateEwayBill(ewbId, dto, user);
  }

  // -------------------- GSTR FILING --------------------

  @Post('gstr/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Generate a new GSTR filing for an organization' })
  @ApiParam({ name: 'organizationId', type: String })
  @ApiBody({ type: GenerateGstrDto })
  @ApiResponse({ status: 201, description: 'GSTR filing created', type: GstrFilingResponseDto })
  async generateGstr(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: GenerateGstrDto,
    @CurrentUser() user: RequestUser,
  ): Promise<GstrFilingResponseDto> {
    return this.complianceService.generateGstr(dto, organizationId, user);
  }

  @Get('gstr/:organizationId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all GSTR filings for an organization' })
  @ApiParam({ name: 'organizationId', type: String })
  @ApiResponse({ status: 200, description: 'List of GSTR filings', type: [GstrFilingResponseDto] })
  async getGstrFilings(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<GstrFilingResponseDto[]> {
    return this.complianceService.getGstrFilings(organizationId);
  }

  @Patch('gstr/:filingId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Update a GSTR filing (status, payload, filed date)' })
  @ApiParam({ name: 'filingId', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { enum: Object.values(GstrFilingStatus), type: 'string' },
        payload: { type: 'object', additionalProperties: true },
        filedAt: { type: 'string', format: 'date-time' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({ status: 200, description: 'Updated GSTR filing', type: GstrFilingResponseDto })
  async updateGstrFiling(
    @Param('filingId', ParseUUIDPipe) filingId: string,
    @Body() body: { status: GstrFilingStatus; payload?: Record<string, any>; filedAt?: Date },
    @CurrentUser() user: RequestUser,
  ): Promise<GstrFilingResponseDto> {
    const { status, payload, filedAt } = body;
    return this.complianceService.updateGstrFiling(filingId, status, payload, filedAt, user);
  }
}
