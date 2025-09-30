import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationResponseDto,
  OrganizationQueryDto,
} from './dto/organization.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, OrganizationParam } from '../../common/decorators/auth.decorator';
import { UserRole } from '../../common/enums';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(private readonly organizationsService: OrganizationsService) {}

  // ✅ Public creation route
  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a new organization (no auth required)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Organization successfully created.',
    type: OrganizationResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'GSTIN or PAN already exists.' })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    this.logger.log('Incoming CREATE ORG request:');
    this.logger.log(JSON.stringify(createOrganizationDto, null, 2));

    try {
      const org = await this.organizationsService.create(createOrganizationDto);
      this.logger.log('Organization created successfully: ' + org.organizationId);
      return org;
    } catch (error) {
      this.logger.error('Error creating organization:', error);
      throw error; // Let Nest handle the exception for proper HTTP response
    }
  }

  // ✅ Protected routes
  @UseGuards(AuthGuard, RolesGuard)
  @Get()
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'List organizations with filters and pagination' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organizations retrieved.', type: [OrganizationResponseDto] })
  async findAll(@Query() query: OrganizationQueryDto) {
    this.logger.log('Fetching organizations with query: ' + JSON.stringify(query));
    return this.organizationsService.findAll(query);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Get(':orgId')
  @OrganizationParam('orgId')
  @Roles(UserRole.ADMIN, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get organization details' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organization retrieved.', type: OrganizationResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Organization not found.' })
  async findOne(@Param('orgId') orgId: string) {
    this.logger.log(`Fetching organization with ID: ${orgId}`);
    return this.organizationsService.findOne(orgId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Patch(':orgId')
  @OrganizationParam('orgId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Update organization details' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Organization updated.', type: OrganizationResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Organization not found.' })
  async update(@Param('orgId') orgId: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    this.logger.log(`Incoming UPDATE ORG request for ID: ${orgId}`);
    this.logger.log(JSON.stringify(updateOrganizationDto, null, 2));

    return this.organizationsService.update(orgId, updateOrganizationDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Delete(':orgId')
  @OrganizationParam('orgId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Organization deleted.' })
  async remove(@Param('orgId') orgId: string) {
    this.logger.log(`Deleting organization with ID: ${orgId}`);
    await this.organizationsService.remove(orgId);
  }
}
