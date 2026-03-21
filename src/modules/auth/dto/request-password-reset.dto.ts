import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({ description: 'Email address for password reset' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
