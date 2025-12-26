import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions } from 'nest-winston';
import { format, transports } from 'winston';
import type TransportStream from 'winston-transport';
import * as fs from 'fs';

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;
const DEFAULT_MAX_FILES = 5;

const isErrorLevel = (level?: string) => level === 'error' || level === 'fatal';

const filterBy = (predicate: (info: Record<string, any>) => boolean) =>
    format((info) => (predicate(info) ? info : false))();

const isAccessLog = (info: Record<string, any>) => info.logType === 'access';
const isAuditLog = (info: Record<string, any>) => info.logType === 'audit';

const buildPrettyFormat = (colorize: boolean) => {
    const baseFormat = format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        format.splat(),
    );

    const consoleFormat = format.printf((info) => {
        const {
            level,
            message: msg,
            timestamp,
            context: logContext,
            trace,
            stack,
            ...meta
        } = info;
        const contextLabel = logContext ? ` [${logContext}]` : '';
        const message =
            typeof msg === 'string' ? msg : JSON.stringify(msg);

        const metaString =
            Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        const traceInfo = trace ?? stack;
        const traceString = traceInfo ? `\n${traceInfo}` : '';

        return `${timestamp} ${level}${contextLabel} ${message}${metaString}${traceString}`;
    });

    return colorize
        ? format.combine(baseFormat, format.colorize({ all: true }), consoleFormat)
        : format.combine(baseFormat, consoleFormat);
};

export const createLoggerOptions = (
    configService: ConfigService,
): WinstonModuleOptions => {
    const env = configService.get<string>('app.env') ?? 'development';
    const appName =
        configService.get<string>('app.name') ?? 'base_code_nestjs_server';
    const isProd = env === 'production';

    const level =
        configService.get<string>('logger.level') ??
        (isProd ? 'info' : 'debug');

    const jsonEnabled =
        configService.get<boolean>('logger.json') ?? isProd;

    const consoleEnabled =
        configService.get<boolean>('logger.console.enabled') ?? true;
    const consoleColorize =
        configService.get<boolean>('logger.console.colorize') ?? !isProd;

    const fileEnabled =
        configService.get<boolean>('logger.file.enabled') ?? false;
    const fileDir =
        configService.get<string>('logger.file.dir') ?? 'logs';
    const fileMaxSize =
        configService.get<number>('logger.file.maxSize') ?? DEFAULT_MAX_SIZE;
    const fileMaxFiles =
        configService.get<number>('logger.file.maxFiles') ?? DEFAULT_MAX_FILES;

    const appFileEnabled =
        configService.get<boolean>('logger.file.app.enabled') ?? fileEnabled;
    const appFileName =
        configService.get<string>('logger.file.app.name') ??
        configService.get<string>('logger.file.name') ??
        'app.log';

    const errorFileEnabled =
        configService.get<boolean>('logger.file.error.enabled') ?? fileEnabled;
    const errorFileName =
        configService.get<string>('logger.file.error.name') ?? 'error.log';

    const accessFileEnabled =
        configService.get<boolean>('logger.file.access.enabled') ?? fileEnabled;
    const accessFileName =
        configService.get<string>('logger.file.access.name') ?? 'access.log';

    const auditFileEnabled =
        configService.get<boolean>('logger.file.audit.enabled') ?? fileEnabled;
    const auditFileName =
        configService.get<string>('logger.file.audit.name') ?? 'audit.log';

    const transportsList: TransportStream[] = [];

    if (consoleEnabled) {
        transportsList.push(
            new transports.Console({
                format: jsonEnabled
                    ? format.combine(
                        format.errors({ stack: true }),
                        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                        format.json(),
                    )
                    : buildPrettyFormat(consoleColorize),
            }),
        );
    }

    const fileOutputsEnabled =
        appFileEnabled || errorFileEnabled || accessFileEnabled || auditFileEnabled;

    if (fileOutputsEnabled) {
        fs.mkdirSync(fileDir, { recursive: true });
    }

    if (appFileEnabled) {
        transportsList.push(
            new transports.File({
                dirname: fileDir,
                filename: appFileName,
                maxsize: fileMaxSize,
                maxFiles: fileMaxFiles,
                tailable: true,
                format: format.combine(
                    filterBy(
                        (info) =>
                            !isErrorLevel(info.level) &&
                            !isAccessLog(info) &&
                            !isAuditLog(info),
                    ),
                    format.errors({ stack: true }),
                    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                    format.json(),
                ),
            }),
        );
    }

    if (errorFileEnabled) {
        transportsList.push(
            new transports.File({
                dirname: fileDir,
                filename: errorFileName,
                maxsize: fileMaxSize,
                maxFiles: fileMaxFiles,
                tailable: true,
                format: format.combine(
                    filterBy((info) => isErrorLevel(info.level)),
                    format.errors({ stack: true }),
                    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                    format.json(),
                ),
            }),
        );
    }

    if (accessFileEnabled) {
        transportsList.push(
            new transports.File({
                dirname: fileDir,
                filename: accessFileName,
                maxsize: fileMaxSize,
                maxFiles: fileMaxFiles,
                tailable: true,
                format: format.combine(
                    filterBy((info) => isAccessLog(info)),
                    format.errors({ stack: true }),
                    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                    format.json(),
                ),
            }),
        );
    }

    if (auditFileEnabled) {
        transportsList.push(
            new transports.File({
                dirname: fileDir,
                filename: auditFileName,
                maxsize: fileMaxSize,
                maxFiles: fileMaxFiles,
                tailable: true,
                format: format.combine(
                    filterBy((info) => isAuditLog(info)),
                    format.errors({ stack: true }),
                    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                    format.json(),
                ),
            }),
        );
    }

    if (transportsList.length === 0) {
        transportsList.push(
            new transports.Console({
                format: buildPrettyFormat(consoleColorize),
            }),
        );
    }

    return {
        level,
        defaultMeta: {
            service: appName,
            env,
        },
        transports: transportsList,
    };
};
