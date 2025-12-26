import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { authConfig } from './auth.config';
import { databaseConfig } from './database.config';
import { loggerConfig } from './logger.config';
import { mailConfig } from './mail.config';
import { metricsConfig } from './metrics.config';
import { oauthConfig } from './oauth.config';
import { queueConfig } from './queue.config';
import { throttlerConfig } from './throttler.config';
import { twoFactorConfig } from './twofactor.config';
import { validate } from './env.validation';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
            envFilePath: ['.env'],
            load: [appConfig, authConfig, databaseConfig, loggerConfig, mailConfig, metricsConfig, oauthConfig, queueConfig, throttlerConfig, twoFactorConfig],
            validate,
        }),
    ],
})
export class AppConfigModule { }
