import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger';
import { ResponseTransformInterceptor } from './common/interceptor/response-transform/response-transform.interceptor';
import { GlobalExceptionFilter } from './common/filter/global/global.filter';
import { AppLogger } from './common/logger/logger.service';
import { LogProducerService } from './common/logger/log-producer.service';
import helmet from 'helmet';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const appLogger = await app.resolve(AppLogger);
    app.useLogger(appLogger);
    app.flushLogs();
    app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );
    const configService = app.get(ConfigService);
    setupSwagger(app, configService);

    const corsConfig = configService.get<any>('app.cors') ?? {}
    const corsMethods =
        corsConfig?.methods ?? ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
    const corsAllowedHeaders =
        corsConfig?.allowedHeaders ??
        ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Trace-Id']
    const corsExposedHeaders =
        corsConfig?.exposedHeaders ?? ['X-Request-Id', 'X-Trace-Id']

    app.use(
        helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
        }),
    );

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true)

            const allowedOrigins = corsConfig?.origin ?? true
            if (allowedOrigins === true || allowedOrigins.includes(origin)) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: corsConfig?.credentials ?? false,
        methods: corsMethods,
        allowedHeaders: corsAllowedHeaders,
        exposedHeaders: corsExposedHeaders,
        maxAge: corsConfig?.maxAge,
    })
    const prefix = configService.get<string>('app.prefix') ?? 'api/v1'
    app.setGlobalPrefix(prefix)

    const reflector = app.get(Reflector)
    app.useGlobalInterceptors(new ResponseTransformInterceptor(reflector))
    const logProducer = app.get(LogProducerService)
    app.useGlobalFilters(new GlobalExceptionFilter(logProducer, configService))
    const port = configService.get<number>('app.port') ?? 3000;
    await app.listen(port);
}
bootstrap();
