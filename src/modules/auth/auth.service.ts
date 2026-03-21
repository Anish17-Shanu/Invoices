import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrganizationsService } from '../organizations/organizations.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly organizationsService: OrganizationsService,
    private readonly configService: ConfigService,
  ) {}

  private async buildAuthPayload(user: {
    userId: string;
    email: string;
    role: UserRole;
    organizationId?: string;
  }) {
    let workspaceId: string | undefined;

    if (user.organizationId) {
      try {
        const organization = await this.organizationsService.findOne(user.organizationId);
        workspaceId = organization.workspaceId;
      } catch {
        workspaceId = undefined;
      }
    }

    return {
      sub: user.userId,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      workspaceId,
      roles: [user.role],
    };
  }

  private passwordFingerprint(passwordHash: string) {
    return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
  }

  private async issueTokens(user: {
    userId: string;
    email: string;
    role: UserRole;
    organizationId?: string;
  }) {
    const payload = await this.buildAuthPayload(user);
    const accessExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1d');
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '14d');
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      this.configService.get<string>('JWT_SECRET');

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(
        {
          sub: user.userId,
          email: user.email,
          organizationId: user.organizationId,
          type: 'refresh',
        },
        {
          secret: refreshSecret,
          expiresIn: refreshExpiresIn,
        },
      ),
      token_type: 'Bearer',
      expires_in: accessExpiresIn,
      refresh_expires_in: refreshExpiresIn,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password: _password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);

    return {
      success: true,
      message: 'Login successful',
      ...tokens,
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

      const role = (registerDto.role ?? UserRole.ADMIN).toLowerCase() as UserRole;

      const user: User = await this.usersService.createUser({
        email: registerDto.email,
        password: hashedPassword,
        role,
        organizationId,
      });

      const tokens = await this.issueTokens(user);

      return {
        success: true,
        message: 'User registered successfully',
        ...tokens,
        user,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException(error.message || 'Registration failed');
    }
  }

  async refresh(refreshToken: string) {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ??
        this.configService.get<string>('JWT_SECRET');

      const payload = this.jwtService.verify(refreshToken, { secret: refreshSecret }) as {
        sub: string;
        type?: string;
      };

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      const tokens = await this.issueTokens(user);

      return {
        success: true,
        message: 'Token refreshed successfully',
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Refresh token is invalid or expired');
    }
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email);
    const exposeToken = this.configService.get<string>('PASSWORD_RESET_EXPOSE_TOKEN', 'true') === 'true';
    const appBaseUrl = this.configService.get<string>('APP_BASE_URL', '').replace(/\/$/, '');
    const resetExpiresIn = this.configService.get<string>('PASSWORD_RESET_EXPIRES_IN', '15m');

    if (!user) {
      return {
        success: true,
        message: 'If the account exists, a password reset flow has been initiated.',
      };
    }

    const resetSecret =
      this.configService.get<string>('PASSWORD_RESET_SECRET') ??
      this.configService.get<string>('JWT_SECRET');

    const token = this.jwtService.sign(
      {
        sub: user.userId,
        email: user.email,
        pwd: this.passwordFingerprint(user.password),
        type: 'password_reset',
      },
      {
        secret: resetSecret,
        expiresIn: resetExpiresIn,
      },
    );

    return {
      success: true,
      message: 'Password reset token generated successfully.',
      delivery: exposeToken
        ? {
            token,
            resetUrl: appBaseUrl ? `${appBaseUrl}/reset-password?token=${token}` : undefined,
            expires_in: resetExpiresIn,
          }
        : {
            channel: 'Bring-your-own notification provider',
            expires_in: resetExpiresIn,
          },
    };
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    try {
      const resetSecret =
        this.configService.get<string>('PASSWORD_RESET_SECRET') ??
        this.configService.get<string>('JWT_SECRET');

      const payload = this.jwtService.verify(token, { secret: resetSecret }) as {
        sub: string;
        pwd: string;
        type?: string;
      };

      if (payload.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid password reset token');
      }

      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      if (this.passwordFingerprint(user.password) !== payload.pwd) {
        throw new UnauthorizedException('Password reset token has already been used or invalidated');
      }

      const password = await bcrypt.hash(newPassword, 10);
      await this.usersService.updatePassword(user.userId, password);

      return {
        success: true,
        message: 'Password reset successful',
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Password reset token is invalid or expired');
    }
  }
}
