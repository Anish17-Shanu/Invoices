// src/modules/invoices/invoices.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

describe('InvoicesController', () => {
  let controller: InvoicesController;
  let service: InvoicesService;

  const mockUser: RequestUser = {
    userId: 'user-123',
    email: 'test@example.com',
    organizationId: 'org1',
    workspaceId: 'workspace-123',
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN],
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    sendInvoice: jest.fn(),
    voidInvoice: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [{ provide: InvoicesService, useValue: mockService }],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an invoice', async () => {
    const dto = { items: [] };
    const invoice = { invoiceId: 'i1' };
    mockService.create.mockResolvedValue(invoice);

    const result = await controller.create('org1', dto as any, mockUser);
    expect(result).toEqual(invoice);
    expect(service.create).toHaveBeenCalledWith('org1', dto);
  });

  it('should return invoices list', async () => {
    const data = { data: [], meta: {} };
    mockService.findAll.mockResolvedValue(data);

    const result = await controller.findAll('org1', {} as any);
    expect(result).toEqual(data.data);
    expect(service.findAll).toHaveBeenCalledWith('org1', {} as any);
  });

  it('should return single invoice', async () => {
    const invoice = { invoiceId: 'i1' };
    mockService.findOne.mockResolvedValue(invoice);

    const result = await controller.findOne('org1', 'i1');
    expect(result).toEqual(invoice);
    expect(service.findOne).toHaveBeenCalledWith('org1', 'i1');
  });

  it('should update invoice', async () => {
    const invoice = { invoiceId: 'i1', customerName: 'Updated' };
    mockService.update.mockResolvedValue(invoice);

    const result = await controller.update(
      'org1',
      'i1',
      { customerName: 'Updated' } as any,
    );
    expect(result).toEqual(invoice);
    expect(service.update).toHaveBeenCalledWith(
      'org1',
      'i1',
      { customerName: 'Updated' },
    );
  });

  it('should send invoice', async () => {
    const invoice = { invoiceId: 'i1', status: 'SENT' };
    mockService.sendInvoice.mockResolvedValue(invoice);

    const result = await controller.sendInvoice('org1', 'i1');
    expect(result).toEqual(invoice);
    expect(service.sendInvoice).toHaveBeenCalledWith('org1', 'i1');
  });

  it('should void invoice', async () => {
    mockService.voidInvoice.mockResolvedValue(undefined);

    await controller.voidInvoice('org1', 'i1');
    expect(service.voidInvoice).toHaveBeenCalledWith('org1', 'i1');
  });
});
