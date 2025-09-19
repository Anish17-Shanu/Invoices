import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsObject, ValidateNested } from 'class-validator';
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
  @ApiProperty({ description: 'Workspace ID from Flocci OS' })
  @IsUUID()
  workspaceId: string;

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

  @ApiProperty({ description: 'Organization address', required: false, type: AddressDto })
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
}

export class OrganizationResponseDto {
  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Workspace ID' })
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
