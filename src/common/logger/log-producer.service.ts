import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { AppLogger } from './logger.service';
import { LOG_JOB_NAME, LOG_QUEUE_NAME } from './log-queue.constants.js';
import { LogJobPayload } from './log-queue.types';
import { LogWriterService } from './log-writer.service';

@Injectable()
export class LogProducerService {
    private readonly enabled: boolean;

    constructor(
        @InjectQueue(LOG_QUEUE_NAME)
        private readonly queue: Queue<LogJobPayload>,
        private readonly configService: ConfigService,
        private readonly writer: LogWriterService,
        private readonly logger: AppLogger,
    ) {
        this.enabled =
            this.configService.get<boolean>('queue.log.enabled') ?? false;
        this.logger.setContext(LogProducerService.name);
    }

    log(message: string, meta?: Record<string, any>, context?: string) {
        return this.enqueue({
            level: 'info',
            message,
            meta,
            context,
        });
    }

    warn(message: string, meta?: Record<string, any>, context?: string) {
        return this.enqueue({
            level: 'warn',
            message,
            meta,
            context,
        });
    }

    debug(message: string, meta?: Record<string, any>, context?: string) {
        return this.enqueue({
            level: 'debug',
            message,
            meta,
            context,
        });
    }

    error(
        message: string,
        meta?: Record<string, any>,
        trace?: string,
        context?: string,
    ) {
        return this.enqueue({
            level: 'error',
            message,
            meta,
            trace,
            context,
        });
    }

    fatal(
        message: string,
        meta?: Record<string, any>,
        trace?: string,
        context?: string,
    ) {
        return this.enqueue({
            level: 'fatal',
            message,
            meta,
            trace,
            context,
        });
    }

    access(message: string, meta?: Record<string, any>, context?: string) {
        return this.enqueue({
            type: 'access',
            message,
            meta,
            context,
        });
    }

    audit(message: string, meta?: Record<string, any>, context?: string) {
        return this.enqueue({
            type: 'audit',
            message,
            meta,
            context,
        });
    }

    private async enqueue(payload: LogJobPayload) {
        if (!this.enabled) {
            this.writer.write(payload);
            return;
        }

        try {
            await this.queue.add(LOG_JOB_NAME, payload);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            this.logger.warn(
                {
                    message: 'Log queue enqueue failed, fallback to direct',
                    error: errorMessage,
                },
                LogProducerService.name,
            );
            this.writer.write(payload);
        }
    }
}
