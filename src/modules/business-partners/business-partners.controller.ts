import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  Query, 
  ParseUUIDPipe, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BusinessPartnersService } from './business-partners.service';
import { 
  CreateBusinessPartnerDto, 
  UpdateBusinessPartnerDto, 
  BusinessPartnerResponseDto, 
  BusinessPartnerQueryDto 
} from './dto/business-partner.dto';

@ApiTags('Business Partners')
@Controller('partners')
export class BusinessPartnersController {
  constructor(private readonly partnersService: BusinessPartnersService) {}

  // 🔹 Create a new business partner
  @Post()
  @ApiOperation({ summary: 'Create a new business partner' })
  @ApiResponse({ status: 201, description: 'Partner successfully created', type: BusinessPartnerResponseDto })
  async create(@Body() dto: CreateBusinessPartnerDto): Promise<BusinessPartnerResponseDto> {
    return this.partnersService.create(dto);
  }

  // 🔹 Get all partners with filters, search, pagination
  @Get()
  @ApiOperation({ summary: 'Get all business partners with optional filters' })
  @ApiResponse({ status: 200, description: 'List of partners', type: [BusinessPartnerResponseDto] })
  async findAll(@Query() query: BusinessPartnerQueryDto): Promise<BusinessPartnerResponseDto[]> {
    return this.partnersService.findAll(query);
  }

  // 🔹 Get single partner by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get partner by ID' })
  @ApiParam({ name: 'id', description: 'Partner ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Partner details', type: BusinessPartnerResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<BusinessPartnerResponseDto> {
    return this.partnersService.findOne(id);
  }

  // 🔹 Update a partner
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing business partner' })
  @ApiParam({ name: 'id', description: 'Partner ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Partner successfully updated', type: BusinessPartnerResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessPartnerDto
  ): Promise<BusinessPartnerResponseDto> {
    return this.partnersService.update(id, dto);
  }

  // 🔹 Delete a partner
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a business partner' })
  @ApiParam({ name: 'id', description: 'Partner ID', type: 'string' })
  @ApiResponse({ status: 204, description: 'Partner successfully deleted' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.partnersService.remove(id);
  }
}
