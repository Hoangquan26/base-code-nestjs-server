import { Controller, Get, NotFoundException, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
    constructor(private readonly metrics: MetricsService) { }

    @Get('metrics')
    async getMetrics(@Res() res: Response) {
        if (!this.metrics.isEnabled()) {
            throw new NotFoundException();
        }

        res.setHeader('Content-Type', this.metrics.getContentType());
        res.send(await this.metrics.getMetrics());
    }
}
