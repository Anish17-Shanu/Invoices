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
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BusinessPartnersService } from './business-partners.service';
import {
  CreateBusinessPartnerDto,
  UpdateBusinessPartnerDto,
  BusinessPartnerResponseDto,
  BusinessPartnerQueryDto,
} from './dto/business-partner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

@ApiTags('Business Partners')
@Controller('organizations/:orgId/partners') // ✅ nested under organization
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessPartnersController {
  constructor(private readonly partnersService: BusinessPartnersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Create a new business partner' })
  @ApiResponse({ status: 201, type: BusinessPartnerResponseDto })
  create(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() dto: CreateBusinessPartnerDto,
    @CurrentUser() user: RequestUser,
  ) {
    if (!user?.roles) throw new UnauthorizedException('User roles not found');
    return this.partnersService.create(dto, user, orgId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  findAll(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: BusinessPartnerQueryDto,
    @CurrentUser() user: RequestUser,
  ) {
    if (!user?.roles) throw new UnauthorizedException('User roles not found');
    return this.partnersService.findAll(query, user, orgId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  findOne(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    if (!user?.roles) throw new UnauthorizedException('User roles not found');
    return this.partnersService.findOne(id, user, orgId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  update(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessPartnerDto,
    @CurrentUser() user: RequestUser,
  ) {
    if (!user?.roles) throw new UnauthorizedException('User roles not found');
    return this.partnersService.update(id, dto, user, orgId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: RequestUser,
  ) {
    if (!user?.roles) throw new UnauthorizedException('User roles not found');
    return this.partnersService.remove(id, user, orgId);
  }
}
