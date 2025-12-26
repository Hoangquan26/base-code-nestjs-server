import { registerAs } from '@nestjs/config';

const parseBoolean = (value?: string) => {
    if (value === undefined) {
        return undefined;
    }

    return value === 'true';
};

export const metricsConfig = registerAs('metrics', () => ({
    enabled: parseBoolean(process.env.METRICS_ENABLED),
}));
