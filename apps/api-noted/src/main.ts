import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Body parser dinonaktifkan agar limit payload bisa dinaikkan untuk upload berkas form (base64).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Global prefix: /api
  app.setGlobalPrefix('api');

  // Penyajian statis berkas form pendukung (gambar, PDF, dokumen).
  const uploadRoot =
    process.env.NOTED_UPLOAD_DIR || join(process.cwd(), 'uploads', 'noted');
  app.useStaticAssets(uploadRoot, { prefix: '/uploads/' });

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
  console.log(`📁 [api-noted] Static uploads served from: ${uploadRoot} at /uploads/`);
}

bootstrap();
