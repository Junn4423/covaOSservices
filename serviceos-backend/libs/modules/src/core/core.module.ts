/**
 * ============================================================
 * CORE MODULE
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

// Services
import { AuthService } from './services/auth.service';
import { DoanhNghiepService } from './services/doanh-nghiep.service';
import { NguoiDungService } from './services/nguoi-dung.service';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { DoanhNghiepController } from './controllers/doanh-nghiep.controller';
import { NguoiDungController } from './controllers/nguoi-dung.controller';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'serviceos-secret-key',
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
                },
            }),
        }),
    ],
    controllers: [AuthController, DoanhNghiepController, NguoiDungController],
    providers: [AuthService, DoanhNghiepService, NguoiDungService],
    exports: [AuthService, DoanhNghiepService, NguoiDungService],
})
export class CoreModule { }
