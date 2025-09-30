// src/modules/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../../common/enums/user-role.enum'; // exact import

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call authService.login and return access_token', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password' };
      const result = { access_token: 'jwt.token' };

      mockAuthService.login.mockResolvedValue(result);

      const response = await controller.login(dto);

      expect(response).toEqual(result);
      expect(service.login).toHaveBeenCalledWith(dto.email, dto.password);
    });
  });

  describe('register', () => {
    it('should call authService.register and return user + token', async () => {
      const dto: RegisterDto = {
        email: 'new@example.com',
        password: 'secret',
        role: UserRole.ADMIN, // using correct enum
      };

      const result = {
        user: {
          userId: 'uuid',
          email: dto.email,
          role: UserRole.ADMIN,
          organizationId: undefined,
        },
        access_token: 'jwt.token',
      };

      mockAuthService.register.mockResolvedValue(result);

      const response = await controller.register(dto);

      expect(response).toEqual(result);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });
});
