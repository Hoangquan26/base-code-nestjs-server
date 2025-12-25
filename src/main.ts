import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger';
import { ResponseTransformInterceptor } from './common/interceptor/response-transform/response-transform.interceptor';
import { GlobalExceptionFilter } from './common/filter/global/global.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );
    const configService = app.get(ConfigService);
    setupSwagger(app, configService);

    const corsConfig = configService.get<any>('app.cors')

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true)

            const allowedOrigins = corsConfig.origin
            if (allowedOrigins === true || allowedOrigins.includes(origin)) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: corsConfig?.credentials ?? false,
    })
    const prefix = configService.get<string>('app.prefix') ?? 'api/v1'
    app.setGlobalPrefix(prefix)

    const reflector = app.get(Reflector)
    app.useGlobalInterceptors(new ResponseTransformInterceptor(reflector))
    app.useGlobalFilters(new GlobalExceptionFilter())
    const port = configService.get<number>('app.port') ?? 3000;
    await app.listen(port);
}
bootstrap();
