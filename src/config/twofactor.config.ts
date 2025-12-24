import { registerAs } from '@nestjs/config';

export const twoFactorConfig = registerAs('twoFactor', () => ({
  issuer: process.env.TOTP_ISSUER ?? 'Vincenza',
  period: Number.parseInt(process.env.TOTP_PERIOD ?? '30', 10),
  digits: Number.parseInt(process.env.TOTP_DIGITS ?? '6', 10),
  encryptionKey: process.env.TWO_FACTOR_ENCRYPTION_KEY ?? '',
}));
