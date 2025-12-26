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
        methods: process.env.APP_CORS_METHODS?.split(',').map(method => method.trim()),
        allowedHeaders: process.env.APP_CORS_ALLOWED_HEADERS?.split(',').map(header => header.trim()),
        exposedHeaders: process.env.APP_CORS_EXPOSED_HEADERS?.split(',').map(header => header.trim()),
        maxAge: process.env.APP_CORS_MAX_AGE
            ? Number.parseInt(process.env.APP_CORS_MAX_AGE, 10)
            : undefined,
    },
}));
