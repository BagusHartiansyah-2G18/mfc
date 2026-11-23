import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    // Global prefix: /api
    app.setGlobalPrefix('api');
    // CORS diizinkan untuk seluruh micro frontend
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    });
    const port = process.env.PORT_API_NOTED || 3002;
    await app.listen(port, '0.0.0.0');
    console.log(`🚀 [api-noted] Notes & Hierarchy Microservice running on: http://localhost:${port}/api`);
}
bootstrap();
