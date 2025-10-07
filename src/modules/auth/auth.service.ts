// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      roles: [user.role],
    };

    return {
      success: true,
      message: 'Login successful',
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      const existing = await this.usersService.findByEmail(registerDto.email);
      if (existing) {
        throw new ConflictException('Email already registered');
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      let organizationId = registerDto.organizationId;
      if (!organizationId) {
        const org = await this.organizationsService.create({
          name: `${registerDto.email.split('@')[0]} Org`,
        });
        organizationId = org.organizationId;
      }

      // 🔧 Normalize role (ensure it matches DB enum format)
      const role = (registerDto.role ?? UserRole.VIEWER).toLowerCase() as UserRole;

      const user: User = await this.usersService.createUser({
        email: registerDto.email,
        password: hashedPassword,
        role,
        organizationId,
      });

      const payload = {
        sub: user.userId,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        roles: [user.role],
      };

      return {
        success: true,
        message: 'User registered successfully',
        access_token: this.jwtService.sign(payload),
        user,
      };
    } catch (err) {
      console.error('🔥 Register error:', err);

      // ✅ Don’t wrap known exceptions
      if (err instanceof ConflictException || err instanceof UnauthorizedException) {
        throw err;
      }

      // ✅ Handle bcrypt errors or other unknown issues
      throw new InternalServerErrorException(err.message || 'Registration failed');
    }
  }
}
