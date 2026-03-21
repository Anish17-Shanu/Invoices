import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/auth.decorator';
import { AuthService } from './auth.service';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Returns access and refresh tokens for a valid user',
    schema: {
      example: {
        access_token: 'jwt.token.here',
        refresh_token: 'refresh.jwt.token.here',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new standalone user and provision an organization if needed' })
  @ApiResponse({
    status: 201,
    description: 'Returns tokens and the created user',
    schema: {
      example: {
        access_token: 'jwt.token.here',
        refresh_token: 'refresh.jwt.token.here',
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          role: 'admin',
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: '2025-09-26T12:34:56.789Z',
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh an access token with a valid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Public()
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a password reset token for an existing account' })
  async requestPasswordReset(@Body() requestDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestDto.email);
  }

  @Public()
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new password using a valid reset token' })
  async confirmPasswordReset(@Body() confirmDto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(confirmDto.token, confirmDto.newPassword);
  }
}
