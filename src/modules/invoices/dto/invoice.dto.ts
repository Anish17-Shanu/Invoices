import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsUUID, 
  IsDateString, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  ValidateNested, 
  IsArray, 
  ArrayMinSize 
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InvoiceStatus } from '../../../common/enums';

export class CreateInvoiceItemDto {
  @ApiProperty({ description: 'Product ID (optional, for catalog items)', required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Item description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'HSN/SAC code', required: false })
  @IsOptional()
  @IsString()
  hsnSacCode?: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber({ maxDecimalPlaces: 2 })
  quantity: number;

  @ApiProperty({ description: 'Rate per unit' })
  @IsNumber({ maxDecimalPlaces: 2 })
  rate: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Business partner ID' })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ description: 'Invoice number' })
  @IsString()
  invoiceNumber: string;

  @ApiProperty({ description: 'Issue date (YYYY-MM-DD)' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ description: 'Due date (YYYY-MM-DD)' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Terms and conditions', required: false })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ description: 'Invoice items', type: [CreateInvoiceItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}

export class UpdateInvoiceDto {
  @ApiProperty({ description: 'Business partner ID', required: false })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiProperty({ description: 'Invoice number', required: false })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiProperty({ description: 'Issue date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @ApiProperty({ description: 'Due date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Terms and conditions', required: false })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiProperty({ description: 'Invoice items', type: [CreateInvoiceItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}

export class InvoiceItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  itemId: string;

  @ApiProperty({ description: 'Product ID', required: false })
  productId?: string;

  @ApiProperty({ description: 'Description' })
  description: string;

  @ApiProperty({ description: 'HSN/SAC code', required: false })
  hsnSacCode?: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Rate' })
  rate: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Line total' })
  lineTotal: number;
}

export class InvoiceResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Partner ID' })
  partnerId: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Issue date' })
  issueDate: Date;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiProperty({ description: 'Status', enum: InvoiceStatus })
  status: InvoiceStatus;

  @ApiProperty({ description: 'Subtotal' })
  subtotal: number;

  @ApiProperty({ description: 'Total tax' })
  totalTax: number;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Amount paid' })
  amountPaid: number;

  @ApiProperty({ description: 'IRN (Invoice Reference Number)', required: false })
  irn?: string;

  @ApiProperty({ description: 'QR code URL', required: false })
  qrCodeUrl?: string;

  @ApiProperty({ description: 'Notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Terms', required: false })
  terms?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiProperty({ description: 'Invoice items', type: [InvoiceItemResponseDto] })
  items: InvoiceItemResponseDto[];
}

export class InvoiceQueryDto {
  @ApiProperty({ description: 'Filter by status', enum: InvoiceStatus, required: false })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiProperty({ description: 'Filter by partner ID', required: false })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiProperty({ description: 'Filter from date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ description: 'Filter to date (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ description: 'Sort by field', required: false, default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: 'Sort order', required: false, enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({ description: 'Page number (1-based)', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page', required: false, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number = 10;
}
