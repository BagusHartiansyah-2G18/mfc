import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url:
            process.env.DATABASE_NOTED_URL ||
            process.env.DOCKER_DATABASE_NOTED_URL ||
            'mysql://root:root@localhost:3306/bgs_noted',
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ [api-noted] Prisma connected to MySQL Database at bgs_noted');
    } catch (error) {
      console.warn('⚠️ [api-noted] Prisma could not connect to MySQL at startup:', (error as Error).message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
