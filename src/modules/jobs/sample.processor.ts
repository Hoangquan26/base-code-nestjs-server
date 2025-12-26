import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LogProducerService } from 'src/common/logger/log-producer.service';
import { SAMPLE_QUEUE_NAME } from './jobs.constants';
import type { SampleJobPayload } from './jobs.service';

@Processor(SAMPLE_QUEUE_NAME)
export class SampleJobProcessor extends WorkerHost {
    constructor(private readonly logProducer: LogProducerService) {
        super();
    }

    async process(job: Job<SampleJobPayload>) {
        void this.logProducer.log(
            'Sample job processed',
            {
                jobId: job.id,
                name: job.name,
                attemptsMade: job.attemptsMade,
                data: job.data,
            },
            SampleJobProcessor.name,
        );
    }
}
