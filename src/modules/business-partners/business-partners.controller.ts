import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseUUIDPipe, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BusinessPartnersService } from './business-partners.service';
import { CreateBusinessPartnerDto, UpdateBusinessPartnerDto, BusinessPartnerResponseDto, BusinessPartnerQueryDto } from './dto/business-partner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

@ApiTags('Business Partners')
@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessPartnersController {
  constructor(private readonly partnersService: BusinessPartnersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Create a new business partner' })
  @ApiResponse({ status: 201, type: BusinessPartnerResponseDto })
  // Ensure user object contains 'roles' array for role-based access
  create(@Body() dto: CreateBusinessPartnerDto, @CurrentUser() user: RequestUser) {
    if (!user || !user.roles) {
      throw new Error('User roles not found in token payload');
    }
    return this.partnersService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  findAll(@Query() query: BusinessPartnerQueryDto, @CurrentUser() user: RequestUser) {
    if (!user || !user.roles) {
      throw new Error('User roles not found in token payload');
    }
    return this.partnersService.findAll(query, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    if (!user || !user.roles) {
      throw new Error('User roles not found in token payload');
    }
    return this.partnersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBusinessPartnerDto, @CurrentUser() user: RequestUser) {
    if (!user || !user.roles) {
      throw new Error('User roles not found in token payload');
    }
    return this.partnersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: RequestUser) {
    if (!user || !user.roles) {
      throw new Error('User roles not found in token payload');
    }
    return this.partnersService.remove(id, user);
  }
}
