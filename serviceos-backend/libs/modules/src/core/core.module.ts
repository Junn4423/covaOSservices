/**
 * ============================================================
 * CORE MODULE - Xác thực, Người dùng, Doanh nghiệp (Tenant)
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { NguoiDungService } from './services/nguoi-dung.service';
import { NguoiDungController } from './controllers/nguoi-dung.controller';
import { DoanhNghiepService } from './services/doanh-nghiep.service';
import { DoanhNghiepController } from './controllers/doanh-nghiep.controller';

@Module({
    controllers: [AuthController, NguoiDungController, DoanhNghiepController],
    providers: [AuthService, NguoiDungService, DoanhNghiepService],
    exports: [AuthService, NguoiDungService, DoanhNghiepService],
})
export class CoreModule { }
