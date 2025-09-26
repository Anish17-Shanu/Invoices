// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/auth.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
    description: 'Returns a JWT access token',
    schema: {
      example: {
        access_token: 'jwt.token.here',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    // 👇 use email instead of username to match RegisterDto
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'Returns a JWT access token and the created user',
    schema: {
      example: {
        access_token: 'jwt.token.here',
        user: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          role: 'viewer',
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: '2025-09-26T12:34:56.789Z',
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
