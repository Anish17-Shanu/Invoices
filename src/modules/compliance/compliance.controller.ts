import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import {
  ComplianceService,
} from './compliance.service';
import {
  CreateEwayBillDto,
  EwayBillResponseDto,
  GenerateGstrDto,
  GstrFilingResponseDto,
  EwayBillStatus,
} from './dto/compliance.dto';
import { GstrFilingStatus } from '../../entities/gstr-filing.entity';

@ApiTags('Compliance')
@Controller('compliance')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  // -------------------- E-WAY BILL --------------------

  @Post('eway-bill')
  @ApiOperation({ summary: 'Create a new E-Way Bill for an invoice' })
  @ApiBody({ type: CreateEwayBillDto })
  @ApiResponse({ status: 201, description: 'E-Way Bill created', type: EwayBillResponseDto })
  async createEwayBill(@Body() dto: CreateEwayBillDto): Promise<EwayBillResponseDto> {
    return this.complianceService.createEwayBill(dto);
  }

  @Get('eway-bill/invoice/:invoiceId')
  @ApiOperation({ summary: 'Get all E-Way Bills for a given invoice' })
  @ApiParam({ name: 'invoiceId', type: String })
  @ApiResponse({ status: 200, description: 'List of E-Way Bills', type: [EwayBillResponseDto] })
  async getEwayBillsByInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ): Promise<EwayBillResponseDto[]> {
    return this.complianceService.getEwayBillByInvoice(invoiceId);
  }

  @Patch('eway-bill/:ewbId')
  @ApiOperation({ summary: 'Update an existing E-Way Bill' })
  @ApiParam({ name: 'ewbId', type: String })
  @ApiBody({ type: CreateEwayBillDto })
  @ApiResponse({ status: 200, description: 'Updated E-Way Bill', type: EwayBillResponseDto })
  async updateEwayBill(
    @Param('ewbId', ParseUUIDPipe) ewbId: string,
    @Body() dto: Partial<CreateEwayBillDto>,
  ): Promise<EwayBillResponseDto> {
    return this.complianceService.updateEwayBill(ewbId, dto);
  }

  // -------------------- GSTR FILING --------------------

  @Post('gstr/:organizationId')
  @ApiOperation({ summary: 'Generate a new GSTR filing for an organization' })
  @ApiParam({ name: 'organizationId', type: String })
  @ApiBody({ type: GenerateGstrDto })
  @ApiResponse({ status: 201, description: 'GSTR filing created', type: GstrFilingResponseDto })
  async generateGstr(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: GenerateGstrDto,
  ): Promise<GstrFilingResponseDto> {
    return this.complianceService.generateGstr(dto, organizationId);
  }

  @Get('gstr/:organizationId')
  @ApiOperation({ summary: 'Get all GSTR filings for an organization' })
  @ApiParam({ name: 'organizationId', type: String })
  @ApiResponse({ status: 200, description: 'List of GSTR filings', type: [GstrFilingResponseDto] })
  async getGstrFilings(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<GstrFilingResponseDto[]> {
    return this.complianceService.getGstrFilings(organizationId);
  }

  @Patch('gstr/:filingId')
  @ApiOperation({ summary: 'Update a GSTR filing (status, payload, filed date)' })
  @ApiParam({ name: 'filingId', type: String })
  @ApiBody({ schema: { 
    type: 'object', 
    properties: {
      status: { enum: Object.values(GstrFilingStatus), type: 'string' },
      payload: { type: 'object', additionalProperties: true },
      filedAt: { type: 'string', format: 'date-time' }
    }, 
    required: ['status'] 
  }})
  @ApiResponse({ status: 200, description: 'Updated GSTR filing', type: GstrFilingResponseDto })
  async updateGstrFiling(
    @Param('filingId', ParseUUIDPipe) filingId: string,
    @Body() body: { status: GstrFilingStatus; payload?: Record<string, any>; filedAt?: Date },
  ): Promise<GstrFilingResponseDto> {
    const { status, payload, filedAt } = body;
    return this.complianceService.updateGstrFiling(filingId, status, payload, filedAt);
  }
}
