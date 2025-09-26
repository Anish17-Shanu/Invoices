import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsObject, 
  ValidateNested, 
  Length, 
  Min 
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PartnerType } from '../../../common/enums';
import { AddressDto } from '../../organizations/dto/organization.dto';

// 🔹 Invoice Summary DTO for nested responses
export class InvoiceSummaryDto {
  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice status' })
  status: string;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;
}

// 🔹 Create DTO
export class CreateBusinessPartnerDto {
  @ApiProperty({ description: 'Partner name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Partner type', enum: PartnerType })
  @IsEnum(PartnerType)
  type: PartnerType;

  @ApiProperty({ description: 'GSTIN number (15 characters)', required: false, example: '22AAAAA0000A1Z5' })
  @IsOptional()
  @IsString()
  @Length(15, 15, { message: 'GSTIN must be 15 characters long' })
  gstin?: string;

  @ApiProperty({ description: 'PAN number (10 characters)', required: false, example: 'ABCDE1234F' })
  @IsOptional()
  @IsString()
  @Length(10, 10, { message: 'PAN must be 10 characters long' })
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

// 🔹 Update DTO
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
  @Length(15, 15, { message: 'GSTIN must be 15 characters long' })
  gstin?: string;

  @ApiProperty({ description: 'PAN number (10 characters)', required: false })
  @IsOptional()
  @IsString()
  @Length(10, 10, { message: 'PAN must be 10 characters long' })
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

// 🔹 Response DTO
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

  @ApiProperty({ description: 'Billing address', required: false, type: AddressDto })
  billingAddress?: AddressDto;

  @ApiProperty({ description: 'Shipping address', required: false, type: AddressDto })
  shippingAddress?: AddressDto;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Invoices for this partner', required: false, type: [InvoiceSummaryDto] })
  invoices?: InvoiceSummaryDto[];
}

// 🔹 Query DTO
export class BusinessPartnerQueryDto {
  @ApiProperty({ description: 'Filter by partner type', enum: PartnerType, required: false })
  @IsOptional()
  @IsEnum(PartnerType)
  type?: PartnerType;

  @ApiProperty({ description: 'Page number (1-based)', required: false, default: 1, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page: number = 1;

  @ApiProperty({ description: 'Number of items per page', required: false, default: 10, type: Number })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit: number = 10;

  @ApiProperty({ description: 'Search term for partner name', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
