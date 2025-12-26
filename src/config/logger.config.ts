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

const resolveFileEnabled = (
    masterEnabled: boolean | undefined,
    value: boolean | undefined,
) => {
    if (value !== undefined) {
        return value;
    }

    return masterEnabled;
};

export const loggerConfig = registerAs('logger', () => ({
    level: process.env.LOG_LEVEL,
    json: parseBoolean(process.env.LOG_JSON),
    console: {
        enabled: parseBoolean(process.env.LOG_CONSOLE_ENABLED),
        colorize: parseBoolean(process.env.LOG_CONSOLE_COLORIZE),
    },
    file: {
        enabled: parseBoolean(process.env.LOG_FILE_ENABLED),
        dir: process.env.LOG_FILE_DIR,
        name: process.env.LOG_FILE_NAME,
        maxSize: parseNumber(process.env.LOG_FILE_MAXSIZE),
        maxFiles: parseNumber(process.env.LOG_FILE_MAXFILES),
        app: {
            enabled: resolveFileEnabled(
                parseBoolean(process.env.LOG_FILE_ENABLED),
                parseBoolean(process.env.LOG_APP_FILE_ENABLED),
            ),
            name: process.env.LOG_APP_FILE_NAME ?? process.env.LOG_FILE_NAME,
        },
        error: {
            enabled: resolveFileEnabled(
                parseBoolean(process.env.LOG_FILE_ENABLED),
                parseBoolean(process.env.LOG_ERROR_FILE_ENABLED),
            ),
            name: process.env.LOG_ERROR_FILE_NAME,
        },
        access: {
            enabled: resolveFileEnabled(
                parseBoolean(process.env.LOG_FILE_ENABLED),
                parseBoolean(process.env.LOG_ACCESS_FILE_ENABLED),
            ),
            name: process.env.LOG_ACCESS_FILE_NAME,
        },
        audit: {
            enabled: resolveFileEnabled(
                parseBoolean(process.env.LOG_FILE_ENABLED),
                parseBoolean(process.env.LOG_AUDIT_FILE_ENABLED),
            ),
            name: process.env.LOG_AUDIT_FILE_NAME,
        },
    },
}));
