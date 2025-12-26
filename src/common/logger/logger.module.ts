import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { LOG_QUEUE_NAME } from './log-queue.constants.js';
import { LogProcessor } from './log.processor';
import { LogProducerService } from './log-producer.service';
import { LogWriterService } from './log-writer.service';
import { createLoggerOptions } from './logger.config';
import { AppLogger } from './logger.service';

@Global()
@Module({
    imports: [
        ConfigModule,
        WinstonModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: createLoggerOptions,
        }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host:
                        configService.get<string>('queue.redis.host') ??
                        'localhost',
                    port:
                        configService.get<number>('queue.redis.port') ?? 6379,
                    password: configService.get<string>(
                        'queue.redis.password',
                    ),
                    db: configService.get<number>('queue.redis.db'),
                },
            }),
        }),
        BullModule.registerQueue({
            name: LOG_QUEUE_NAME,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: 1000,
            },
        }),
    ],
    providers: [AppLogger, LogWriterService, LogProducerService, LogProcessor],
    exports: [AppLogger, LogProducerService, WinstonModule],
})
export class LoggerModule { }
