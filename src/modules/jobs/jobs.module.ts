import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SAMPLE_QUEUE_NAME } from './jobs.constants';
import { JobsService } from './jobs.service';
import { SampleJobProcessor } from './sample.processor';

@Module({
    imports: [
        BullModule.registerQueue({
            name: SAMPLE_QUEUE_NAME,
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: 1000,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
            },
        }),
    ],
    providers: [JobsService, SampleJobProcessor],
    exports: [JobsService],
})
export class JobsModule { }
