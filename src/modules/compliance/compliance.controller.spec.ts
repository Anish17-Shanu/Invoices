import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { CreateEwayBillDto, GenerateGstrDto, EwayBillStatus } from './dto/compliance.dto'; // ✅ import enum from dto
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';
import { GstrFilingStatus } from '../../common/enums'; // ✅ use centralized enums

describe('ComplianceController', () => {
  let controller: ComplianceController;
  let service: ComplianceService;

  const mockUser: RequestUser = {
    userId: 'user-123',
    email: 'test@example.com',
    organizationId: 'org-123',
    workspaceId: 'workspace-123',
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN],
  };

  const mockEwayBill = {
    ewbId: 'ewb-1',
    invoiceId: 'inv-1',
    ewbNumber: 'EWB123',
    status: EwayBillStatus.ACTIVE,
  };

  const mockGstr = {
    filingId: 'filing-1',
    organizationId: 'org-123',
    type: 'GSTR1',
    period: '2025-09',
    status: GstrFilingStatus.PENDING,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComplianceController],
      providers: [
        {
          provide: ComplianceService,
          useValue: {
            createEwayBill: jest.fn().mockResolvedValue(mockEwayBill),
            getEwayBillByInvoice: jest.fn().mockResolvedValue([mockEwayBill]),
            updateEwayBill: jest.fn().mockResolvedValue({
              ...mockEwayBill,
              status: EwayBillStatus.UPDATED,
            }),
            generateGstr: jest.fn().mockResolvedValue(mockGstr),
            getGstrFilings: jest.fn().mockResolvedValue([mockGstr]),
            updateGstrFiling: jest
              .fn()
              .mockImplementation((filingId, status, arg3, arg4, user) =>
                Promise.resolve({ ...mockGstr, status }),
              ),
          },
        },
      ],
    }).compile();

    controller = module.get<ComplianceController>(ComplianceController);
    service = module.get<ComplianceService>(ComplianceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createEwayBill → should call service and return result', async () => {
    const dto: CreateEwayBillDto = {
      invoiceId: 'inv-1',
      ewbNumber: 'EWB123',
    } as any;
    const result = await controller.createEwayBill(dto, mockUser);
    expect(result).toEqual(mockEwayBill);
    expect(service.createEwayBill).toHaveBeenCalledWith(dto, mockUser);
  });

  it('getEwayBillsByInvoice → should return bills', async () => {
    const result = await controller.getEwayBillsByInvoice('inv-1');
    expect(result).toEqual([mockEwayBill]);
    expect(service.getEwayBillByInvoice).toHaveBeenCalledWith('inv-1');
  });

  it('updateEwayBill → should update and return bill', async () => {
    const dto: Partial<CreateEwayBillDto> = {
      status: EwayBillStatus.UPDATED,
    }; // ✅ correct enum reference
    const result = await controller.updateEwayBill('ewb-1', dto, mockUser);
    expect(result.status).toBe(EwayBillStatus.UPDATED);
    expect(service.updateEwayBill).toHaveBeenCalledWith('ewb-1', dto, mockUser);
  });

  it('generateGstr → should create GSTR filing', async () => {
    const dto: GenerateGstrDto = {
      type: 'GSTR1',
      period: '2025-09',
    } as any;
    const result = await controller.generateGstr('org-123', dto, mockUser);
    expect(result).toEqual(mockGstr);
    expect(service.generateGstr).toHaveBeenCalledWith(dto, 'org-123', mockUser);
  });

  it('getGstrFilings → should return filings', async () => {
    const result = await controller.getGstrFilings('org-123');
    expect(result).toEqual([mockGstr]);
    expect(service.getGstrFilings).toHaveBeenCalledWith('org-123');
  });

  it('updateGstrFiling → should update and return filing', async () => {
    const body = { status: GstrFilingStatus.FILED };
    const result = await controller.updateGstrFiling(
      'filing-1',
      body,
      mockUser,
    );
    expect(result.status).toBe(GstrFilingStatus.FILED);
    expect(service.updateGstrFiling).toHaveBeenCalledWith(
      'filing-1',
      body.status,
      undefined,
      undefined,
      mockUser,
    );
  });
});
