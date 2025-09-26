// src/modules/auth/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../../common/enums';

export class RegisterDto {
  @ApiProperty({ description: 'Unique User ID (can be generated client-side as UUID)' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Organization ID user belongs to' })
  @IsUUID()
  organizationId: string;

  @ApiProperty({ description: 'email for login' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Password for login' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'User role', enum: UserRole, default: UserRole.VIEWER })
  @IsEnum(UserRole)
  role: UserRole;
}
