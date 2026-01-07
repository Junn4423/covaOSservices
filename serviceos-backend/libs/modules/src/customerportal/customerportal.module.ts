/**
 * ============================================================
 * CUSTOMERPORTAL MODULE - Cổng khách hàng
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Module cung cấp cổng truy cập cho khách hàng:
 * 
 * Xác thực (customer/auth/*):
 * - POST /customer/auth/register - Đăng ký tài khoản
 * - POST /customer/auth/login    - Đăng nhập
 * - GET  /customer/auth/profile  - Thông tin tài khoản
 * 
 * Tính năng Portal (customer/portal/*):
 * - GET  /customer/portal/profile  - Thông tin khách hàng
 * - GET  /customer/portal/jobs     - Danh sách công việc
 * - GET  /customer/portal/quotes   - Danh sách báo giá
 * - POST /customer/portal/reviews  - Gửi đánh giá
 * - GET  /customer/portal/reviews  - Danh sách đánh giá
 * 
 * LƯU Ý: Khách hàng được lưu trong TaiKhoanKhach, không phải NguoiDung
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

// Services
import { CustomerAuthService } from './services/customer-auth.service';
import { CustomerPortalService } from './services/customer-portal.service';

// Controllers
import { CustomerAuthController } from './controllers/customer-auth.controller';
import { CustomerPortalController } from './controllers/customer-portal.controller';

// Strategies & Guards
import { CustomerJwtStrategy } from './strategies/customer-jwt.strategy';
import { CustomerAuthGuard } from './guards/customer-auth.guard';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'customer-jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'serviceos-secret-key',
                signOptions: { expiresIn: '15m' },
            }),
        }),
    ],
    controllers: [
        CustomerAuthController,
        CustomerPortalController,
    ],
    providers: [
        CustomerAuthService,
        CustomerPortalService,
        CustomerJwtStrategy,
        CustomerAuthGuard,
    ],
    exports: [
        CustomerAuthService,
        CustomerPortalService,
        CustomerAuthGuard,
    ],
})
export class CustomerPortalModule { }
