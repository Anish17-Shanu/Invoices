// test/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersService } from '../src/modules/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OrganizationsService } from '../src/modules/organizations/organizations.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
          },
        },
        {
          provide: OrganizationsService,
          useValue: {
            create: jest.fn().mockResolvedValue({ organizationId: 'org-123' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return null for invalid user credentials', async () => {
    // Mock the dependency so no real DB call happens
    const usersService = {
      findByEmail: jest.fn().mockResolvedValue(null),
    };
    (service as any).usersService = usersService;

    const result = await service.validateUser('wrong', 'wrong');
    expect(result).toBeNull();
  });
});
