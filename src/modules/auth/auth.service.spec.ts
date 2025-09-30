import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../common/enums';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

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
            sign: jest.fn().mockReturnValue('signed.jwt.token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials match', async () => {
      const user = { userId: '1', email: 'a@a.com', password: 'hashed' };
      usersService.findByEmail.mockResolvedValue(user as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(user.email, 'password');
      expect(result).toEqual({ userId: '1', email: 'a@a.com' });
    });

    it('should return null if user not found or password mismatch', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      expect(await service.validateUser('x@x.com', 'pass')).toBeNull();

      usersService.findByEmail.mockResolvedValue({ email: 'a@a.com', password: 'hashed' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      expect(await service.validateUser('a@a.com', 'wrong')).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token on valid credentials', async () => {
      const user = {
        userId: 'u1',
        email: 'a@a.com',
        password: 'hashed',
        role: UserRole.VIEWER,
        organizationId: 'org-1',
      };
      jest.spyOn(service, 'validateUser').mockResolvedValue(user as any);

      const result = await service.login(user.email, 'password');
      expect(result).toEqual({ access_token: 'signed.jwt.token' });
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login('x@x.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create a new user and return token', async () => {
      const dto = { email: 'new@example.com', password: 'plain', organizationId: 'org-123' };
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      usersService.createUser.mockResolvedValue({
        userId: 'uuid',
        email: dto.email,
        role: UserRole.VIEWER,
        organizationId: dto.organizationId,
      } as any);

      const result = await service.register(dto as any);

      expect(result).toEqual({
        access_token: 'signed.jwt.token',
        user: {
          userId: 'uuid',
          email: dto.email,
          role: UserRole.VIEWER,
          organizationId: dto.organizationId,
        },
      });
      expect(usersService.createUser).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      usersService.findByEmail.mockResolvedValue({ email: 'taken@example.com' } as any);

      await expect(
        service.register({ email: 'taken@example.com', password: '123', organizationId: 'org' } as any),
      ).rejects.toThrow(ConflictException);
    });
  });
});
