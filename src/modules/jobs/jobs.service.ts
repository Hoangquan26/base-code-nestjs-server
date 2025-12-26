import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SAMPLE_JOB_NAME, SAMPLE_QUEUE_NAME } from './jobs.constants';

export interface SampleJobPayload {
    id: string;
    payload?: string;
}

@Injectable()
export class JobsService {
    constructor(
        @InjectQueue(SAMPLE_QUEUE_NAME)
        private readonly queue: Queue<SampleJobPayload>,
    ) { }

    enqueueSample(payload: SampleJobPayload, delayMs = 0) {
        return this.queue.add(SAMPLE_JOB_NAME, payload, {
            delay: delayMs,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
    }
}
