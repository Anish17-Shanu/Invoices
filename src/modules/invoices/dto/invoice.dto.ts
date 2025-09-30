// src/modules/invoices/dto/invoice.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, IsUUID, IsDateString, IsEnum, IsOptional, ValidateNested, 
  IsArray, ArrayMinSize, IsNumber, IsIn 
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InvoiceStatus } from '../../../common/enums/invoice-status.enum';
import { PaymentResponseDto } from '../../payments/dto/payment.dto';

// 🔹 Invoice Item (Input DTO)
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

  @ApiProperty({ description: 'GST rate percent (optional)', required: false, example: 18 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  gstRatePercent?: number;
}

// 🔹 Invoice Create DTO
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

// 🔹 Invoice Update DTO
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

  @ApiProperty({ description: 'Invoice status', required: false, enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}

// 🔹 Invoice Item Response DTO
export class InvoiceItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  @IsUUID()
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

// 🔹 Invoice Response DTO
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

  @ApiProperty({ description: 'Payments for this invoice', required: false, type: () => [PaymentResponseDto] })
  payments?: PaymentResponseDto[];

  @ApiProperty({ description: 'Partner details (summary)', required: false })
  partner?: { partnerId: string; name: string; type: string };
}

// 🔹 Invoice Query DTO
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

  @ApiProperty({ description: 'Sort by field', required: false, enum: ['createdAt', 'issueDate', 'dueDate', 'totalAmount'], default: 'createdAt' })
  @IsOptional()
  sortBy?: 'createdAt' | 'issueDate' | 'dueDate' | 'totalAmount' = 'createdAt';

  @ApiProperty({ description: 'Sort order', required: false, enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({ description: 'Page number (1-based)', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @ApiProperty({ description: 'Number of items per page', required: false, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;
}
