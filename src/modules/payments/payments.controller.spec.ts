import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentResponseDto } from './dto/payment.dto';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole, PaymentMode } from '../../common/enums';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    createPayment: jest.fn(),
    getPaymentsByInvoice: jest.fn(),
    getPaymentById: jest.fn(),
    updatePayment: jest.fn(),
  };

  const mockUser: RequestUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN],
    organizationId: 'org-1',
    workspaceId: 'workspace-1',
    name: 'Test User',
    iat: 1690000000,
    exp: 1690003600,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockPaymentsService }],
    }).compile();

    controller = module.get(PaymentsController);
    service = module.get(PaymentsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should create a payment', async () => {
    const dto: CreatePaymentDto = {
      amount: 500,
      paymentDate: new Date().toISOString(),
      mode: PaymentMode.UPI,
      transactionId: 'txn-1',
      notes: 'test',
    };

    const expected: PaymentResponseDto = {
      paymentId: 'pay-1',
      invoiceId: 'inv-1',
      organizationId: 'org-1',
      amount: dto.amount,
      paymentDate: new Date(dto.paymentDate),
      mode: dto.mode,
      transactionId: dto.transactionId,
      notes: dto.notes,
      createdAt: new Date(),
    };

    mockPaymentsService.createPayment.mockResolvedValue(expected);

    const result = await controller.createPayment('inv-1', dto, mockUser);

    expect(service.createPayment).toHaveBeenCalledWith('inv-1', dto, mockUser);
    expect(result).toEqual(expected);
  });

  it('should get payments by invoice', async () => {
    const expected: PaymentResponseDto[] = [
      {
        paymentId: 'pay-1',
        invoiceId: 'inv-1',
        organizationId: 'org-1',
        amount: 500,
        paymentDate: new Date(),
        mode: PaymentMode.UPI,
        createdAt: new Date(),
      },
    ];

    mockPaymentsService.getPaymentsByInvoice.mockResolvedValue(expected);

    const result = await controller.getPaymentsByInvoice('inv-1');

    expect(service.getPaymentsByInvoice).toHaveBeenCalledWith('inv-1');
    expect(result).toEqual(expected);
  });

  it('should get a payment by ID', async () => {
    const expected: PaymentResponseDto = {
      paymentId: 'pay-1',
      invoiceId: 'inv-1',
      organizationId: 'org-1',
      amount: 500,
      paymentDate: new Date(),
      mode: PaymentMode.UPI,
      createdAt: new Date(),
    };

    mockPaymentsService.getPaymentById.mockResolvedValue(expected);

    const result = await controller.getPaymentById('pay-1');

    expect(service.getPaymentById).toHaveBeenCalledWith('pay-1');
    expect(result).toEqual(expected);
  });

  it('should update a payment', async () => {
    const dto: Partial<CreatePaymentDto> = { amount: 600 };
    const expected: PaymentResponseDto = {
      paymentId: 'pay-1',
      invoiceId: 'inv-1',
      organizationId: 'org-1',
      amount: 600,
      paymentDate: new Date(),
      mode: PaymentMode.UPI,
      createdAt: new Date(),
    };

    mockPaymentsService.updatePayment.mockResolvedValue(expected);

    const result = await controller.updatePayment('pay-1', dto, mockUser);

    expect(service.updatePayment).toHaveBeenCalledWith('pay-1', dto, mockUser);
    expect(result).toEqual(expected);
  });
});
