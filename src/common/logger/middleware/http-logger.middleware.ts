import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../../metrics/metrics.service';
import { LogProducerService } from '../log-producer.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
    constructor(
        private readonly logProducer: LogProducerService,
        private readonly metrics: MetricsService,
    ) { }

    use(req: Request, res: Response, next: NextFunction) {
        const start = process.hrtime.bigint();
        const headerRequestId = req.headers['x-request-id'];
        const requestId =
            (Array.isArray(headerRequestId)
                ? headerRequestId[0]
                : headerRequestId) ?? randomUUID();
        const headerTraceId = req.headers['x-trace-id'];
        const traceId =
            (Array.isArray(headerTraceId)
                ? headerTraceId[0]
                : headerTraceId) ?? requestId;

        (req as any).requestId = requestId;
        (req as any).traceId = traceId;
        res.setHeader('x-request-id', requestId);
        res.setHeader('x-trace-id', traceId);

        res.on('finish', () => {
            const durationMs =
                Number(process.hrtime.bigint() - start) / 1_000_000;
            const path = req.originalUrl ?? req.url;

            void this.logProducer.access(`${req.method} ${path}`, {
                method: req.method,
                path,
                statusCode: res.statusCode,
                durationMs: Math.round(durationMs),
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                requestId,
                traceId,
            }, 'HTTP');

            this.metrics.recordHttpRequest({
                method: req.method,
                path,
                statusCode: res.statusCode,
                durationMs,
            });
        });
        next();
    }
}
