import { Test, TestingModule } from '@nestjs/testing';
import { BusinessPartnersController } from './business-partners.controller';
import { BusinessPartnersService } from './business-partners.service';
import { CreateBusinessPartnerDto, UpdateBusinessPartnerDto, BusinessPartnerQueryDto } from './dto/business-partner.dto';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';

describe('BusinessPartnersController', () => {
  let controller: BusinessPartnersController;
  let service: BusinessPartnersService;

  const mockUser: RequestUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: UserRole.ADMIN as UserRole,
    organizationId: 'org-123',
    workspaceId: 'workspace-123',
    roles: [UserRole.ADMIN],
  };

  const mockPartner = {
    partnerId: 'partner-1',
    organizationId: 'org-123',
    name: 'Test Partner',
    type: 'vendor',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessPartnersController],
      providers: [
        {
          provide: BusinessPartnersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockPartner),
            findAll: jest.fn().mockResolvedValue([mockPartner]),
            findOne: jest.fn().mockResolvedValue(mockPartner),
            update: jest.fn().mockResolvedValue({ ...mockPartner, name: 'Updated' }),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<BusinessPartnersController>(BusinessPartnersController);
    service = module.get<BusinessPartnersService>(BusinessPartnersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a partner', async () => {
    const dto: CreateBusinessPartnerDto = { name: 'Test Partner', type: 'vendor' } as any;
    const result = await controller.create(dto, mockUser);
    expect(result).toEqual(mockPartner);
    expect(service.create).toHaveBeenCalledWith(dto, mockUser);
  });

  it('should return all partners', async () => {
    const query: BusinessPartnerQueryDto = { page: 1, limit: 10 };
    const result = await controller.findAll(query, mockUser);
    expect(result).toEqual([mockPartner]);
    expect(service.findAll).toHaveBeenCalledWith(query, mockUser);
  });

  it('should return a single partner', async () => {
    const result = await controller.findOne('partner-1', mockUser);
    expect(result).toEqual(mockPartner);
    expect(service.findOne).toHaveBeenCalledWith('partner-1', mockUser);
  });

  it('should update a partner', async () => {
    const dto: UpdateBusinessPartnerDto = { name: 'Updated' } as any;
    const result = await controller.update('partner-1', dto, mockUser);
    expect(result).toEqual({ ...mockPartner, name: 'Updated' });
    expect(service.update).toHaveBeenCalledWith('partner-1', dto, mockUser);
  });

  it('should remove a partner', async () => {
    const result = await controller.remove('partner-1', mockUser);
    expect(result).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith('partner-1', mockUser);
  });
});
