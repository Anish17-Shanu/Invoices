import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartnerType } from '../../../common/enums';
import { AddressDto } from '../../organizations/dto/organization.dto';

export class CreateBusinessPartnerDto {
  @ApiProperty({ description: 'Partner name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Partner type', enum: PartnerType })
  @IsEnum(PartnerType)
  type: PartnerType;

  @ApiProperty({ description: 'GSTIN number (15 characters)', required: false })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiProperty({ description: 'PAN number (10 characters)', required: false })
  @IsOptional()
  @IsString()
  pan?: string;

  @ApiProperty({ description: 'Billing address', required: false, type: AddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @ApiProperty({ description: 'Shipping address', required: false, type: AddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;
}

export class UpdateBusinessPartnerDto {
  @ApiProperty({ description: 'Partner name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Partner type', enum: PartnerType, required: false })
  @IsOptional()
  @IsEnum(PartnerType)
  type?: PartnerType;

  @ApiProperty({ description: 'GSTIN number (15 characters)', required: false })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiProperty({ description: 'PAN number (10 characters)', required: false })
  @IsOptional()
  @IsString()
  pan?: string;

  @ApiProperty({ description: 'Billing address', required: false, type: AddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @ApiProperty({ description: 'Shipping address', required: false, type: AddressDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;
}

export class BusinessPartnerResponseDto {
  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Partner name' })
  name: string;

  @ApiProperty({ description: 'Partner type', enum: PartnerType })
  type: PartnerType;

  @ApiProperty({ description: 'GSTIN number', required: false })
  gstin?: string;

  @ApiProperty({ description: 'PAN number', required: false })
  pan?: string;

  @ApiProperty({ description: 'Billing address', required: false })
  billingAddress?: AddressDto;

  @ApiProperty({ description: 'Shipping address', required: false })
  shippingAddress?: AddressDto;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class BusinessPartnerQueryDto {
  @ApiProperty({ description: 'Filter by partner type', enum: PartnerType, required: false })
  @IsOptional()
  @IsEnum(PartnerType)
  type?: PartnerType;

  @ApiProperty({ description: 'Page number (1-based)', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page', required: false, default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({ description: 'Search term for name', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
