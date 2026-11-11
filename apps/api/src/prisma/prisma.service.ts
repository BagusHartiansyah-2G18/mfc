import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Prisma connected to MySQL Database at localhost:3306 (bgs_user_mgmt)');
    } catch (error) {
      console.warn('⚠️ Prisma could not connect to MySQL at startup:', (error as Error).message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
