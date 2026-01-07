/**
 * ============================================================
 * API GATEWAY - Bootstrap
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ============================================================
  // WebSocket Adapter (Socket.io)
  // ============================================================
  app.useWebSocketAdapter(new IoAdapter(app));

  // ============================================================
  // Global Prefix
  // ============================================================
  app.setGlobalPrefix('api');

  // ============================================================
  // API Versioning
  // ============================================================
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ============================================================
  // CORS - Allow Frontend Origins
  // ============================================================
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ];
  
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ============================================================
  // Global Validation Pipe
  // ============================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on non-whitelisted
      transform: true,            // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============================================================
  // Swagger API Documentation
  // ============================================================
  const config = new DocumentBuilder()
    .setTitle('ServiceOS API')
    .setDescription(`
      ## Hệ sinh thái SaaS Multi-tenant cho Doanh nghiệp Dịch vụ
      
      ### Các phân hệ:
      - **Core**: Xác thực, Người dùng, Doanh nghiệp (Tenant)
      - **TechMate**: Quản lý Công việc, Phân công, Khách hàng
      - **StockPile**: Kho Vật tư, Sản phẩm, Tồn kho
      - **ShiftSquad**: Chấm công, Ca làm việc
      - **AssetTrack**: Tài sản, Thiết bị
      - **RouteOptima**: Lộ trình, Điều phối
      - **QuoteMaster**: Báo giá, Hợp đồng
      - **CashFlow**: Thu chi nội bộ
      - **CustomerPortal**: Cổng khách hàng, Đánh giá
      - **ProcurePool**: Nhà cung cấp, Đơn đặt hàng
      - **Notification**: Hệ thống thông báo
      - **Billing**: Thanh toán SaaS
      
      ### Authentication:
      Sử dụng Bearer Token (JWT) trong header \`Authorization\`
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Xác thực')
    .addTag('Doanh Nghiệp', 'Quản lý Tenant')
    .addTag('Người Dùng', 'Quản lý Nhân viên')
    .addTag('Khách Hàng', 'Quản lý Khách hàng')
    .addTag('Công Việc', 'Quản lý Công việc/Job')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // ============================================================
  // Start Server
  // ============================================================
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                       ServiceOS API                          ║
╠══════════════════════════════════════════════════════════════╣
║  Server:     http://localhost:${port}                           ║
║  API Docs:   http://localhost:${port}/docs                      ║
║  Health:     http://localhost:${port}/api/v1/health             ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
