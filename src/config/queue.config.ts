import { registerAs } from '@nestjs/config';

const parseBoolean = (value?: string) => {
    if (value === undefined) {
        return undefined;
    }

    return value === 'true';
};

const parseNumber = (value?: string) => {
    if (value === undefined) {
        return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
};

export const queueConfig = registerAs('queue', () => ({
    redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseNumber(process.env.REDIS_PORT) ?? 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseNumber(process.env.REDIS_DB),
    },
    log: {
        enabled: parseBoolean(process.env.LOG_QUEUE_ENABLED) ?? false,
    },
}));
