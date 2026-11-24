import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { NotesModule } from './notes/notes.module';
import { RateLimiterMiddleware, MfcCacheService } from './common';

@Module({
  imports: [PrismaModule, NotesModule],
  providers: [MfcCacheService],
  exports: [MfcCacheService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimiterMiddleware).forRoutes('*');
  }
}
