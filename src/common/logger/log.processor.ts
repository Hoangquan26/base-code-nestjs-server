import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LOG_QUEUE_NAME } from './log-queue.constants.js';
import { LogJobPayload } from './log-queue.types';
import { LogWriterService } from './log-writer.service';

@Processor(LOG_QUEUE_NAME)
export class LogProcessor extends WorkerHost {
    constructor(private readonly writer: LogWriterService) {
        super();
    }

    async process(job: Job<LogJobPayload>) {
        this.writer.write(job.data);
    }
}
