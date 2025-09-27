import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty({ description: 'Street address' })
  @IsString()
  street: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'State' })
  @IsString()
  state: string;

  @ApiProperty({ description: 'Postal code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;
}

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Legal name of the organization', required: false })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiProperty({ description: 'GSTIN number (15 characters)' })
  @IsString()
  gstin: string;

  @ApiProperty({ description: 'PAN number (10 characters)' })
  @IsString()
  pan: string;

  @ApiProperty({
    description: 'Organization address',
    required: false,
    type: AddressDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
}

export class UpdateOrganizationDto {
  @ApiProperty({ description: 'Organization name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Legal name of the organization', required: false })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiProperty({ description: 'GSTIN number (15 characters)', required: false })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiProperty({ description: 'PAN number (10 characters)', required: false })
  @IsOptional()
  @IsString()
  pan?: string;

  @ApiProperty({ description: 'Organization address', required: false, type: AddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;
  // ✅ Remove workspaceId from Update DTO
}

export class OrganizationResponseDto {
  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Workspace ID (internal UUID)' })
  workspaceId: string;

  @ApiProperty({ description: 'Organization name' })
  name: string;

  @ApiProperty({ description: 'Legal name', required: false })
  legalName?: string;

  @ApiProperty({ description: 'GSTIN number' })
  gstin: string;

  @ApiProperty({ description: 'PAN number' })
  pan: string;

  @ApiProperty({ description: 'Address', required: false })
  address?: AddressDto;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class OrganizationQueryDto {
  @ApiProperty({ description: 'Search by organization name', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by Workspace ID (internal UUID)', required: false })
  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @ApiProperty({ description: 'Sort by field', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @ApiProperty({ description: 'Sort order', enum: ['ASC', 'DESC'], required: false, default: 'DESC' })
  @IsOptional()
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({ description: 'Page number (1-based)', required: false, default: 1 })
  @IsOptional()
  page: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  limit: number = 10;
}
