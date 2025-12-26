import { Injectable } from '@nestjs/common';
import { AppLogger } from './logger.service';
import { LogJobPayload } from './log-queue.types';

@Injectable()
export class LogWriterService {
    constructor(private readonly logger: AppLogger) { }

    write(payload: LogJobPayload) {
        const { type, level, message, context, meta, trace } = payload;

        if (type === 'access') {
            this.logger.access(message, meta, context);
            return;
        }

        if (type === 'audit') {
            this.logger.audit(message, meta, context);
            return;
        }

        const baseMessage = meta ? { message, ...meta } : message;

        if (level === 'warn') {
            this.logger.warn(baseMessage, context);
            return;
        }

        if (level === 'debug') {
            this.logger.debug(baseMessage, context);
            return;
        }

        if (level === 'error') {
            this.logger.error(baseMessage, trace, context);
            return;
        }

        if (level === 'fatal') {
            const fatalMessage: Record<string, any> = {
                message,
                level: 'fatal',
                ...(meta ?? {}),
            };

            if (trace) {
                fatalMessage.trace = trace;
            }

            this.logger.log(fatalMessage, context);
            return;
        }

        this.logger.log(baseMessage, context);
    }
}
