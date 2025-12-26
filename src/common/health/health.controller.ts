import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
    constructor(private readonly configService: ConfigService) { }

    @Get()
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.round(process.uptime()),
            app: {
                name: this.configService.get<string>('app.name'),
                env: this.configService.get<string>('app.env'),
            },
        };
    }
}
