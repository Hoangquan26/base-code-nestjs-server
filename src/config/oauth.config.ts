import { registerAs } from '@nestjs/config';

export const oauthConfig = registerAs('oauth', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? '',
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID ?? '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? '',
    callbackUrl: process.env.FACEBOOK_CALLBACK_URL ?? '',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GITHUB_CALLBACK_URL ?? '',
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID ?? '',
    teamId: process.env.APPLE_TEAM_ID ?? '',
    keyId: process.env.APPLE_KEY_ID ?? '',
    privateKey: process.env.APPLE_PRIVATE_KEY ?? '',
    callbackUrl: process.env.APPLE_CALLBACK_URL ?? '',
  },
}));
