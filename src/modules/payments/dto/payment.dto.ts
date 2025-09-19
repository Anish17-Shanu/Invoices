import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDateString, IsEnum, IsString, IsOptional } from 'class-validator';
import { PaymentMode } from '../../../common/enums';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Payment amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  amount: number;

  @ApiProperty({ description: 'Payment date (YYYY-MM-DD)' })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ description: 'Payment mode', enum: PaymentMode })
  @IsEnum(PaymentMode)
  mode: PaymentMode;

  @ApiProperty({ description: 'Transaction ID', required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ description: 'Payment notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  paymentId: string;

  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Organization ID' })
  organizationId: string;

  @ApiProperty({ description: 'Payment amount' })
  amount: number;

  @ApiProperty({ description: 'Payment date' })
  paymentDate: Date;

  @ApiProperty({ description: 'Payment mode', enum: PaymentMode })
  mode: PaymentMode;

  @ApiProperty({ description: 'Transaction ID', required: false })
  transactionId?: string;

  @ApiProperty({ description: 'Payment notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}
