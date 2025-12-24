import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  },
  bcryptRounds: Number.parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  tokens: {
    emailVerifyTtlMin: Number.parseInt(process.env.EMAIL_VERIFY_TOKEN_TTL_MIN ?? '30', 10),
    passwordResetTtlMin: Number.parseInt(process.env.PASSWORD_RESET_TOKEN_TTL_MIN ?? '15', 10),
  },
}));
