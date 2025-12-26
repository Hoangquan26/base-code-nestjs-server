import { Inject, Injectable, Scope } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
    private context?: string;

    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) { }

    setContext(context: string) {
        this.context = context;
    }

    log(message: any, context?: string) {
        this.logger.log(message, context ?? this.context);
    }

    error(message: any, trace?: string, context?: string) {
        this.logger.error(message, trace, context ?? this.context);
    }

    warn(message: any, context?: string) {
        this.logger.warn(message, context ?? this.context);
    }

    debug(message: any, context?: string) {
        this.logger.debug?.(message, context ?? this.context);
    }

    verbose(message: any, context?: string) {
        this.logger.verbose?.(message, context ?? this.context);
    }

    access(message: string, meta?: Record<string, any>, context?: string) {
        const payload = { message, logType: 'access', ...(meta ?? {}) };
        this.logger.log(payload, context ?? this.context ?? 'HTTP');
    }

    audit(message: string, meta?: Record<string, any>, context?: string) {
        const payload = { message, logType: 'audit', ...(meta ?? {}) };
        this.logger.log(payload, context ?? this.context ?? 'AUDIT');
    }
}
