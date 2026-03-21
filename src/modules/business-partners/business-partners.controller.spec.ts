import { Test, TestingModule } from '@nestjs/testing';
import { BusinessPartnersController } from './business-partners.controller';
import { BusinessPartnersService } from './business-partners.service';
import {
  CreateBusinessPartnerDto,
  UpdateBusinessPartnerDto,
  BusinessPartnerQueryDto,
} from './dto/business-partner.dto';
import { RequestUser } from '../../common/interfaces/auth.interface';
import { UserRole } from '../../common/enums';
import { PartnerType } from '../../common/enums/partner-type.enum';

describe('BusinessPartnersController', () => {
  let controller: BusinessPartnersController;
  let service: BusinessPartnersService;

  const mockUser: RequestUser = {
    userId: 'user-123',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    organizationId: 'org-123',
    workspaceId: 'workspace-123',
    roles: [UserRole.ADMIN],
  };

  const mockPartner = {
    partnerId: 'partner-1',
    organizationId: 'org-123',
    name: 'Test Partner',
    type: PartnerType.VENDOR,
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
    const dto: CreateBusinessPartnerDto = { name: 'Test Partner', type: PartnerType.VENDOR };
    const result = await controller.create(mockUser.organizationId, dto, mockUser);
    expect(result).toEqual(mockPartner);
    expect(service.create).toHaveBeenCalledWith(dto, mockUser, mockUser.organizationId);
  });

  it('should return all partners', async () => {
    const query: BusinessPartnerQueryDto = { page: 1, limit: 10, type: PartnerType.VENDOR };
    const result = await controller.findAll(mockUser.organizationId, query, mockUser);
    expect(result).toEqual([mockPartner]);
    expect(service.findAll).toHaveBeenCalledWith(query, mockUser, mockUser.organizationId);
  });

  it('should return a single partner', async () => {
    const partnerId = 'partner-1';
    const result = await controller.findOne(mockUser.organizationId, partnerId, mockUser);
    expect(result).toEqual(mockPartner);
    expect(service.findOne).toHaveBeenCalledWith(partnerId, mockUser, mockUser.organizationId);
  });

  it('should update a partner', async () => {
    const partnerId = 'partner-1';
    const dto: UpdateBusinessPartnerDto = { name: 'Updated', type: PartnerType.VENDOR };
    const result = await controller.update(mockUser.organizationId, partnerId, dto, mockUser);
    expect(result).toEqual({ ...mockPartner, name: 'Updated' });
    expect(service.update).toHaveBeenCalledWith(partnerId, dto, mockUser, mockUser.organizationId);
  });

  it('should remove a partner', async () => {
    const partnerId = 'partner-1';
    const result = await controller.remove(mockUser.organizationId, partnerId, mockUser);
    expect(result).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(partnerId, mockUser, mockUser.organizationId);
  });
});
