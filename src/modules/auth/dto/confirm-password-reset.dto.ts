import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ConfirmPasswordResetDto {
  @ApiProperty({ description: 'Password reset token returned by the request flow or your notification layer' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ description: 'New password to set for the account', minLength: 8 })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
