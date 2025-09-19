import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsEnum, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GstrFilingType } from '../../../common/enums';

export class VehicleDetailsDto {
  @ApiProperty({ description: 'Vehicle number' })
  @IsString()
  vehicleNumber: string;

  @ApiProperty({ description: 'Transporter ID' })
  @IsString()
  transporterId: string;

  @ApiProperty({ description: 'Transporter document number' })
  @IsString()
  transporterDocNo: string;

  @ApiProperty({ description: 'Transporter document date (YYYY-MM-DD)' })
  @IsDateString()
  transporterDocDate: string;

  @ApiProperty({ description: 'Transport mode' })
  @IsString()
  transportMode: string;
}

export class CreateEwayBillDto {
  @ApiProperty({ description: 'E-Way Bill number' })
  @IsString()
  ewbNumber: string;

  @ApiProperty({ description: 'Valid from date (YYYY-MM-DD)' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ description: 'Valid until date (YYYY-MM-DD)' })
  @IsDateString()
  validUntil: string;

  @ApiProperty({ description: 'Vehicle details', required: false, type: VehicleDetailsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => VehicleDetailsDto)
  vehicleDetails?: VehicleDetailsDto;

  @ApiProperty({ description: 'E-Way Bill status', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}

export class EwayBillResponseDto {
  @ApiProperty({ description: 'E-Way Bill ID' })
  ewbId: string;

  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'E-Way Bill number' })
  ewbNumber: string;

  @ApiProperty({ description: 'Valid from' })
  validFrom: Date;

  @ApiProperty({ description: 'Valid until' })
  validUntil: Date;

  @ApiProperty({ description: 'Vehicle details', required: false })
  vehicleDetails?: VehicleDetailsDto;

  @ApiProperty({ description: 'Status', required: false })
  status?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}

export class GenerateGstrDto {
  @ApiProperty({ description: 'GSTR filing type', enum: GstrFilingType })
  @IsEnum(GstrFilingType)
  type: GstrFilingType;

  @ApiProperty({ description: 'Period in YYYY-MM format' })
  @IsString()
  period: string;
}

export class GstrFilingResponseDto {
  @ApiProperty({ description: 'Filing ID' })
  filingId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Filing type', enum: GstrFilingType })
  type: GstrFilingType;

  @ApiProperty({ description: 'Period' })
  period: string;

  @ApiProperty({ description: 'Filing status' })
  status: string;

  @ApiProperty({ description: 'Generated payload', required: false })
  payload?: any;

  @ApiProperty({ description: 'Filed at', required: false })
  filedAt?: Date;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}
