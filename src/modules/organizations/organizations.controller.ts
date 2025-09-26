import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationResponseDto,
  OrganizationQueryDto,
} from './dto/organization.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles, OrganizationParam } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@Controller('organizations')
@UseGuards(AuthGuard)
export class OrganizationsController {
  private readonly logger = new Logger(OrganizationsController.name);

  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new organization (workspaceId is auto-generated)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The organization has been successfully created.',
    type: OrganizationResponseDto,
  })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'GSTIN or PAN already exists.' })
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
    @CurrentUser() user: RequestUser,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Creating new organization: ${createOrganizationDto.name}`);
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'List organizations with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organizations retrieved successfully.',
    schema: {
      example: {
        data: [
          {
            organizationId: 'uuid',
            workspaceId: 'uuid-123456',
            name: 'Test Org',
            gstin: '12ABCDE1234F1Z5',
            pan: 'ABCDE1234F',
            createdAt: '2025-09-20T12:00:00.000Z',
            updatedAt: '2025-09-20T12:00:00.000Z',
          },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      },
    },
  })
  async findAll(@Query() query: OrganizationQueryDto) {
    return this.organizationsService.findAll(query);
  }

  @Get(':orgId')
  @OrganizationParam('orgId')
  @Roles(UserRole.VIEWER)
  @ApiOperation({ summary: 'Get organization details' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization details retrieved successfully.',
    type: OrganizationResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Organization not found.' })
  async findOne(@Param('orgId') orgId: string): Promise<OrganizationResponseDto> {
    return this.organizationsService.findOne(orgId);
  }

  @Patch(':orgId')
  @OrganizationParam('orgId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Update organization details' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Organization updated successfully.',
    type: OrganizationResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Organization not found.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'GSTIN or PAN already exists.' })
  async update(
    @Param('orgId') orgId: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    this.logger.log(`Updating organization: ${orgId}`);
    return this.organizationsService.update(orgId, updateOrganizationDto);
  }

  @Delete(':orgId')
  @OrganizationParam('orgId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiParam({ name: 'orgId', description: 'Organization ID' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Organization deleted successfully.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Organization not found.' })
  async remove(@Param('orgId') orgId: string): Promise<void> {
    this.logger.log(`Deleting organization: ${orgId}`);
    await this.organizationsService.remove(orgId);
  }
}

