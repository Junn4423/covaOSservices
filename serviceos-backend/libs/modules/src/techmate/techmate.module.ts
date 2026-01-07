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
 * - /techmate/khach-hang/*
 */

import { Module } from '@nestjs/common';
import { CongViecService } from './services/cong-viec.service';
import { CongViecController, NghiemThuHinhAnhController } from './controllers/cong-viec.controller';
import { PhanCongService } from './services/phan-cong.service';
import { NghiemThuHinhAnhService } from './services/nghiem-thu-hinh-anh.service';
import { KhachHangService } from './services/khach-hang.service';
import { KhachHangController } from './controllers/khach-hang.controller';

@Module({
    controllers: [
        CongViecController,
        NghiemThuHinhAnhController,
        KhachHangController,
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
