import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrganizationsService } from '../organizations/organizations.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let organizationsService: jest.Mocked<OrganizationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: OrganizationsService,
          useValue: {
            createDefaultOrgForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    organizationsService = module.get(OrganizationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const user = { userId: '1', email: 'test@example.com' } as User;
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(user.email);
      expect(result).toEqual(user);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: user.email } });
    });

    it('should return null if no user found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      expect(await service.findByEmail('notfound@example.com')).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const user = { userId: '123', email: 'id@example.com' } as User;
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findById(user.userId);
      expect(result).toEqual(user);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { userId: user.userId } });
    });

    it('should return null if no user found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('missing')).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with provided organizationId', async () => {
      const dto = { email: 'x@example.com', password: 'hashed', organizationId: 'org-1' };

      const userEntity: Partial<User> = {
        ...dto,
        role: UserRole.VIEWER,
      };

      userRepo.create.mockReturnValue(userEntity as User);
      userRepo.save.mockResolvedValue(userEntity as User);

      const result = await service.createUser(dto);

      expect(result).toEqual(userEntity);
      expect(userRepo.create).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
        role: UserRole.VIEWER,
        organizationId: dto.organizationId,
      });
      expect(userRepo.save).toHaveBeenCalledWith(userEntity);
      expect(organizationsService.createDefaultOrgForUser).not.toHaveBeenCalled();
    });

    it('should auto-create org if organizationId not provided', async () => {
      const dto = { email: 'y@example.com', password: 'hashed' };
      const newOrg = { organizationId: 'auto-org-1' };

      const userEntity: Partial<User> = {
        ...dto,
        role: UserRole.VIEWER,
        organizationId: newOrg.organizationId,
      };

      organizationsService.createDefaultOrgForUser.mockResolvedValue(newOrg as any);
      userRepo.create.mockReturnValue(userEntity as User);
      userRepo.save.mockResolvedValue(userEntity as User);

      const result = await service.createUser(dto);

      expect(result).toEqual(userEntity);
      expect(organizationsService.createDefaultOrgForUser).toHaveBeenCalledWith(dto.email);
      expect(userRepo.create).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
        role: UserRole.VIEWER,
        organizationId: newOrg.organizationId,
      });
      expect(userRepo.save).toHaveBeenCalledWith(userEntity);
    });
  });
});
