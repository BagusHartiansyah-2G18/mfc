import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set Global API Prefix: /api
  app.setGlobalPrefix('api');

  // CORS Configuration for MFE Apps (Portal 4200, CompUI 4201, UserMgmt 4202)
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://localhost:4202',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const port = process.env.PORT_API ? Number(process.env.PORT_API) : 3000;
  await app.listen(port);
  console.log(`🚀 NestJS Backend API running on: http://localhost:${port}/api`);
}

bootstrap();
