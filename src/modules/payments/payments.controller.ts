import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentResponseDto } from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // -------------------- Create Payment --------------------
  @Post('invoice/:invoiceId')
  @ApiOperation({ summary: 'Create a payment for a specific invoice' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID', type: 'string' })
  @ApiResponse({ status: 201, description: 'Payment created successfully', type: PaymentResponseDto })
  async createPayment(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.createPayment(invoiceId, dto);
  }

  // -------------------- Get Payments By Invoice --------------------
  @Get('invoice/:invoiceId')
  @ApiOperation({ summary: 'Get all payments for a specific invoice' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'List of payments', type: [PaymentResponseDto] })
  async getPaymentsByInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ): Promise<PaymentResponseDto[]> {
    return this.paymentsService.getPaymentsByInvoice(invoiceId);
  }

  // -------------------- Get Payment By ID --------------------
  @Get(':paymentId')
  @ApiOperation({ summary: 'Get payment details by payment ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Payment details', type: PaymentResponseDto })
  async getPaymentById(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.getPaymentById(paymentId);
  }

  // -------------------- Update Payment --------------------
  @Patch(':paymentId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a payment partially' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Updated payment details', type: PaymentResponseDto })
  async updatePayment(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: Partial<CreatePaymentDto>,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.updatePayment(paymentId, dto);
  }
}