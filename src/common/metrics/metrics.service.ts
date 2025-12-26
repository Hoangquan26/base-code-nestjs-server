import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    Counter,
    Histogram,
    Registry,
    collectDefaultMetrics,
} from 'prom-client';

type HttpMetricsLabels = {
    method: string;
    path: string;
    statusCode: number;
};

@Injectable()
export class MetricsService {
    private readonly enabled: boolean;
    private readonly registry: Registry;
    private readonly httpRequestCounter?: Counter<'method' | 'path' | 'status'>;
    private readonly httpRequestDuration?: Histogram<
        'method' | 'path' | 'status'
    >;

    constructor(private readonly configService: ConfigService) {
        this.enabled =
            this.configService.get<boolean>('metrics.enabled') ?? true;
        this.registry = new Registry();

        if (this.enabled) {
            collectDefaultMetrics({ register: this.registry, prefix: 'app_' });

            this.httpRequestCounter = new Counter({
                name: 'http_requests_total',
                help: 'Total number of HTTP requests',
                labelNames: ['method', 'path', 'status'],
                registers: [this.registry],
            });

            this.httpRequestDuration = new Histogram({
                name: 'http_request_duration_ms',
                help: 'HTTP request duration in ms',
                labelNames: ['method', 'path', 'status'],
                buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
                registers: [this.registry],
            });
        }
    }

    isEnabled() {
        return this.enabled;
    }

    getContentType() {
        return this.registry.contentType;
    }

    async getMetrics() {
        return this.registry.metrics();
    }

    recordHttpRequest({
        method,
        path,
        statusCode,
        durationMs,
    }: HttpMetricsLabels & { durationMs: number }) {
        if (!this.enabled || !this.httpRequestCounter || !this.httpRequestDuration) {
            return;
        }

        const safePath = path.split('?')[0];
        const statusLabel = String(statusCode);

        this.httpRequestCounter.inc({
            method,
            path: safePath,
            status: statusLabel,
        });

        this.httpRequestDuration.observe(
            { method, path: safePath, status: statusLabel },
            durationMs,
        );
    }
}
