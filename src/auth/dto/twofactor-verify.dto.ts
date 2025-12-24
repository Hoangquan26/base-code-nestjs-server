import { IsString, Length } from 'class-validator';

export class TwoFactorVerifyDto {
  @IsString()
  userId: string;

  @IsString()
  @Length(6, 8)
  code: string;
}
