import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    onModuleDestroy() {
        throw new Error('Method not implemented.');
    }
    async onModuleInit() {
        await this.$connect();
    }

    async enableShutdownHooks() {
        await this.$disconnect();
    }

}
