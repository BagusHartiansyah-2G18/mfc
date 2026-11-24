import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { RateLimiterMiddleware, MfcCacheService } from './common';

@Module({
  imports: [PrismaModule, UsersModule, RolesModule, AuthModule],
  providers: [MfcCacheService],
  exports: [MfcCacheService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimiterMiddleware).forRoutes('*');
  }
}
