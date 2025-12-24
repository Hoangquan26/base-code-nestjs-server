import { IsString, Length } from 'class-validator';

export class TwoFactorDisableDto {
  @IsString()
  userId: string;

  @IsString()
  @Length(6, 8)
  code: string;
}
