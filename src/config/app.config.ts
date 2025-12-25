import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
    name: process.env.APP_NAME ?? 'base_code_nestjs_server',
    env: process.env.NODE_ENV ?? 'development',
    port: Number.parseInt(process.env.APP_PORT ?? '3000', 10),
    prefix: process.env.APP_PREFIX ?? 'api/v1',
    url: process.env.APP_URL ?? 'http://localhost:3000',
    cors: {
        origin: process.env.APP_CORS_ORIGIN?.split(',').map(origin => origin.trim()) ?? true,
        credentials: process.env.APP_CORS_CREDENTIALS === 'true',
    },
}));