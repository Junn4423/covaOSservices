/**
 * ============================================================
 * TECHMATE MODULE - Quản lý Công việc & Phân công
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Module chính cho TechMate - Field Service Management:
 * - CongViec: Quản lý công việc (Jobs)
 * - PhanCong: Phân công nhân sự (Assignments)
 * - NghiemThuHinhAnh: Nghiệm thu bằng hình ảnh (Evidence)
 * - KhachHang: Quản lý khách hàng (Customers)
 * 
 * Controllers:
 * - /techmate/cong-viec/*
 * - /techmate/evidence/*
 * - /techmate/khach-hang/* (alias)
 * - /jobs/* (alias for frontend compatibility)
 * - /customers/* (alias for frontend compatibility)
 * - /khach-hang/*
 * 
 * Integration:
 * - NotificationModule: Gui thong bao khi phan cong nhan vien
 */

import { Module } from '@nestjs/common';
import { CongViecService } from './services/cong-viec.service';
import { CongViecController, NghiemThuHinhAnhController } from './controllers/cong-viec.controller';
import { PhanCongService } from './services/phan-cong.service';
import { NghiemThuHinhAnhService } from './services/nghiem-thu-hinh-anh.service';
import { KhachHangService } from './services/khach-hang.service';
import { KhachHangController } from './controllers/khach-hang.controller';
import { JobsAliasController } from './controllers/jobs-alias.controller';
import { CustomersAliasController, TechMateKhachHangAliasController } from './controllers/customers-alias.controller';
import { NotificationModule } from '../notification';

@Module({
    imports: [NotificationModule],
    controllers: [
        CongViecController,
        NghiemThuHinhAnhController,
        KhachHangController,
        // Alias controllers for frontend compatibility
        JobsAliasController,
        CustomersAliasController,
        TechMateKhachHangAliasController,
    ],
    providers: [
        CongViecService,
        PhanCongService,
        NghiemThuHinhAnhService,
        KhachHangService,
    ],
    exports: [
        CongViecService,
        PhanCongService,
        NghiemThuHinhAnhService,
        KhachHangService,
    ],
})
export class TechMateModule { }
