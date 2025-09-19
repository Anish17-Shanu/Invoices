import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDecimal, IsBoolean, IsOptional } from 'class-validator';

export class CreateProductServiceDto {
  @ApiProperty({ description: 'Product/service name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product/service description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'HSN/SAC code', required: false })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiProperty({ description: 'Unit price' })
  @IsNumber({ maxDecimalPlaces: 2 })
  unitPrice: number;

  @ApiProperty({ description: 'GST rate percentage' })
  @IsNumber({ maxDecimalPlaces: 2 })
  gstRatePercent: number;

  @ApiProperty({ description: 'Is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateProductServiceDto {
  @ApiProperty({ description: 'Product/service name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Product/service description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'HSN/SAC code', required: false })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiProperty({ description: 'Unit price', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  unitPrice?: number;

  @ApiProperty({ description: 'GST rate percentage', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  gstRatePercent?: number;

  @ApiProperty({ description: 'Is active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProductServiceResponseDto {
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Product/service name' })
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  description?: string;

  @ApiProperty({ description: 'HSN/SAC code', required: false })
  hsnSacCode?: string;

  @ApiProperty({ description: 'Unit price' })
  unitPrice: number;

  @ApiProperty({ description: 'GST rate percentage' })
  gstRatePercent: number;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;
}
