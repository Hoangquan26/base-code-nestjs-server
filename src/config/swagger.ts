import { type INestApplication } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, configService: ConfigService) {
  const env = configService.get<string>('app.env') ?? 'development';
  if (env === 'production') {
    return;
  }

  const appName = configService.get<string>('app.name') ?? 'API';
  const appUrl = configService.get<string>('app.url') ?? 'http://localhost:3000';

  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(`${appName} API documentation`)
    .setVersion('1.0')
    .addServer(appUrl)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
