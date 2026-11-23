import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix: /api
  app.setGlobalPrefix('api');

  // CORS diizinkan untuk seluruh micro frontend
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://localhost:4202',
      'http://localhost:4203',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:4201',
      'http://127.0.0.1:4202',
      'http://127.0.0.1:4203',
      /^http:\/\/localhost:[0-9]+$/,
      /^http:\/\/127\.0\.0\.1:[0-9]+$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Request-ID',
      'x-request-id',
      'Origin',
    ],
    exposedHeaders: ['X-Request-ID', 'x-request-id'],
  });

  const port = process.env.PORT_API_NOTED || 3002;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 [api-noted] Notes & Hierarchy Microservice running on: http://localhost:${port}/api`);
}

bootstrap();
