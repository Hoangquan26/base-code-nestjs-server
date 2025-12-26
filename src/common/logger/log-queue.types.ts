export type LogQueueType = 'access' | 'audit';
export type LogQueueLevel = 'info' | 'warn' | 'debug' | 'error' | 'fatal';

export interface LogJobPayload {
    type?: LogQueueType;
    level?: LogQueueLevel;
    message: string;
    context?: string;
    meta?: Record<string, any>;
    trace?: string;
}
