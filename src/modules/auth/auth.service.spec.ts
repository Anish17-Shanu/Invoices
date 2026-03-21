import { ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockOrganization = {
      organizationId: 'org-new',
      workspaceId: 'ws-1',
      name: 'Mock Org',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            createUser: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('signed.jwt.token'),
            verify: jest.fn(),
          },
        },
        {
          provide: OrganizationsService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockOrganization),
            createDefaultOrgForUser: jest.fn().mockResolvedValue(mockOrganization),
            findOne: jest.fn().mockResolvedValue(mockOrganization),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string) => {
              const values: Record<string, string> = {
                JWT_EXPIRES_IN: '1d',
                JWT_REFRESH_EXPIRES_IN: '14d',
                JWT_SECRET: 'jwt-secret',
                JWT_REFRESH_SECRET: 'refresh-secret',
                PASSWORD_RESET_SECRET: 'reset-secret',
                PASSWORD_RESET_EXPOSE_TOKEN: 'true',
                PASSWORD_RESET_EXPIRES_IN: '15m',
                APP_BASE_URL: 'https://app.example.com',
              };

              return values[key] ?? fallback;
            }),
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
    it('returns the user without the password when credentials are valid', async () => {
      usersService.findByEmail.mockResolvedValue({
        userId: '1',
        email: 'a@a.com',
        password: 'hashed',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.validateUser('a@a.com', 'password')).resolves.toEqual({
        userId: '1',
        email: 'a@a.com',
      });
    });

    it('returns null when credentials are invalid', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateUser('x@x.com', 'pass')).resolves.toBeNull();
    });
  });

  describe('login', () => {
    it('returns access and refresh tokens for valid credentials', async () => {
      const user = {
        userId: 'u1',
        email: 'a@a.com',
        role: UserRole.VIEWER,
        organizationId: 'org-1',
      };
      jest.spyOn(service, 'validateUser').mockResolvedValue(user as any);

      const result = await service.login(user.email, 'password');

      expect(result).toMatchObject({
        success: true,
        message: 'Login successful',
        access_token: 'signed.jwt.token',
        refresh_token: 'signed.jwt.token',
        user,
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('throws UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(service.login('x@x.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('creates an admin user and returns tokens', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      usersService.createUser.mockResolvedValue({
        userId: 'uuid',
        email: 'new@example.com',
        password: 'hashed',
        role: UserRole.ADMIN,
        organizationId: 'org-new',
      } as any);

      const result = await service.register({ email: 'new@example.com', password: 'plain' } as any);

      expect(result).toMatchObject({
        success: true,
        message: 'User registered successfully',
        access_token: 'signed.jwt.token',
        refresh_token: 'signed.jwt.token',
        user: {
          userId: 'uuid',
          email: 'new@example.com',
          role: UserRole.ADMIN,
          organizationId: 'org-new',
        },
      });
    });

    it('throws ConflictException when the email already exists', async () => {
      usersService.findByEmail.mockResolvedValue({ email: 'taken@example.com' } as any);

      await expect(
        service.register({ email: 'taken@example.com', password: '123', organizationId: 'org' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('wraps unexpected registration errors', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('hash fail'));

      await expect(
        service.register({ email: 'new@example.com', password: 'pass' } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('refresh', () => {
    it('returns a fresh token pair for a valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'u1', type: 'refresh' } as never);
      usersService.findById.mockResolvedValue({
        userId: 'u1',
        email: 'user@example.com',
        password: 'hashed-password',
        role: UserRole.ADMIN,
        organizationId: 'org-1',
      } as any);

      const result = await service.refresh('valid.refresh.token');

      expect(result).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        access_token: 'signed.jwt.token',
        refresh_token: 'signed.jwt.token',
      });
    });
  });

  describe('password reset', () => {
    it('creates a reset token for an existing user', async () => {
      usersService.findByEmail.mockResolvedValue({
        userId: 'u1',
        email: 'user@example.com',
        password: 'hashed-password',
      } as any);

      const result = await service.requestPasswordReset('user@example.com');

      expect(result).toMatchObject({
        success: true,
        message: 'Password reset token generated successfully.',
        delivery: {
          token: 'signed.jwt.token',
          resetUrl: 'https://app.example.com/reset-password?token=signed.jwt.token',
          expires_in: '15m',
        },
      });
    });

    it('resets the password when the token is valid', async () => {
      const currentPasswordHash = 'current-hash';
      jwtService.verify.mockReturnValue({
        sub: 'u1',
        pwd: crypto.createHash('sha256').update(currentPasswordHash).digest('hex').slice(0, 16),
        type: 'password_reset',
      } as never);
      usersService.findById.mockResolvedValue({
        userId: 'u1',
        email: 'user@example.com',
        password: currentPasswordHash,
        role: UserRole.ADMIN,
        organizationId: 'org-1',
      } as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      usersService.updatePassword.mockResolvedValue({ userId: 'u1', password: 'new-hash' } as any);

      await expect(service.confirmPasswordReset('reset.token', 'new-password')).resolves.toEqual({
        success: true,
        message: 'Password reset successful',
      });
      expect(usersService.updatePassword).toHaveBeenCalledWith('u1', 'new-hash');
    });
  });
});
