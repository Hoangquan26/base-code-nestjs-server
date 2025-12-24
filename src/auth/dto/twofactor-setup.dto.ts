import { IsString } from 'class-validator';

export class TwoFactorSetupDto {
  @IsString()
  userId: string;
}
