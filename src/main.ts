import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger';

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

    const cors_origin = configService.get<number>('app.cors_origin') ?? true;
    const cors_creadential = configService.get<number>('app.cors_creadential') ?? true;

    app.enableCors({
        origin: cors_origin,
        credential: cors_creadential
    })
    app.setGlobalPrefix('/api/v1')

    const port = configService.get<number>('app.port') ?? 3000;
    await app.listen(port);
}
bootstrap();
