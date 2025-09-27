import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentResponseDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // ✅ Correct JWT Guard
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard) // ✅ JWT validation + role checks
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  // -------------------- Create Payment --------------------
  @Post('invoice/:invoiceId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Create a payment for a specific invoice' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID', type: 'string' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Payment created successfully', type: PaymentResponseDto })
  async createPayment(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: RequestUser,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`User ${user.userId} creating payment for invoice ${invoiceId}`);
    return this.paymentsService.createPayment(invoiceId, dto);
  }

  // -------------------- Get Payments By Invoice --------------------
  @Get('invoice/:invoiceId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get all payments for a specific invoice' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of payments', type: [PaymentResponseDto] })
  async getPaymentsByInvoice(
    @Param('invoiceId', ParseUUIDPipe) invoiceId: string,
  ): Promise<PaymentResponseDto[]> {
    return this.paymentsService.getPaymentsByInvoice(invoiceId);
  }

  // -------------------- Get Payment By ID --------------------
  @Get(':paymentId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER, UserRole.VIEWER)
  @ApiOperation({ summary: 'Get payment details by payment ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment details', type: PaymentResponseDto })
  async getPaymentById(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.getPaymentById(paymentId);
  }

  // -------------------- Update Payment --------------------
  @Patch(':paymentId')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_MANAGER)
  @ApiOperation({ summary: 'Update a payment partially' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID', type: 'string' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated payment details', type: PaymentResponseDto })
  async updatePayment(
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
    @Body() dto: Partial<CreatePaymentDto>,
    @CurrentUser() user: RequestUser,
  ): Promise<PaymentResponseDto> {
    this.logger.log(`User ${user.userId} updating payment ${paymentId}`);
    return this.paymentsService.updatePayment(paymentId, dto);
  }
}
