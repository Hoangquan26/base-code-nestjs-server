import { registerAs } from '@nestjs/config';

const parseNumber = (value?: string) => {
    if (value === undefined) {
        return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
};

export const throttlerConfig = registerAs('throttler', () => ({
    ttlSec: parseNumber(process.env.THROTTLE_TTL_SEC) ?? 60,
    limit: parseNumber(process.env.THROTTLE_LIMIT) ?? 100,
}));
