// src/modules/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { UserRole } from '../../../common/enums';

export class RegisterDto {
  @ApiProperty({
    description: 'Email for login',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password for login',
    example: 'StrongPassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'User role (optional, defaults to viewer)',
    enum: UserRole,
    default: UserRole.VIEWER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role: UserRole = UserRole.VIEWER;

  @ApiProperty({
    description:
      'Organization ID (optional). If not provided, a new organization will be created automatically.',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
