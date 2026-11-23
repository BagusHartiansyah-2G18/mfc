import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

// Muat .env dari root monorepo maupun direktori kerja saat ini
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set Global API Prefix: /api
  app.setGlobalPrefix('api');

  // CORS Configuration for MFE Apps (Portal 4200, CompUI 4201, UserMgmt 4202, Noted 4203)
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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'x-request-id',
      'Accept',
      'X-Requested-With',
      'Origin',
    ],
    exposedHeaders: ['X-Request-ID', 'x-request-id'],
    credentials: true,
  });

  const port = process.env.PORT_API ? Number(process.env.PORT_API) : 3001;
  await app.listen(port);
  console.log(`🚀 NestJS Backend API running on: http://localhost:${port}/api`);
}

bootstrap();
