// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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
      roles: [user.role], // array for cross-org scenarios
    };

    return { access_token: this.jwtService.sign(payload) };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const role: UserRole = registerDto.role ?? UserRole.VIEWER;

    const user: User = await this.usersService.createUser({
      email: registerDto.email,
      password: hashedPassword,
      role,
      organizationId: registerDto.organizationId,
    });

    const payload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      roles: [user.role],
    };

    return { access_token: this.jwtService.sign(payload), user };
  }
}
