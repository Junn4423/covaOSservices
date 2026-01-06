/**
 * ============================================================
 * TECHMATE MODULE - Quản lý Công việc
 * ============================================================
 */

import { Module } from '@nestjs/common';
import { CongViecService } from './services/cong-viec.service';
import { CongViecController } from './controllers/cong-viec.controller';
import { PhanCongService } from './services/phan-cong.service';
import { KhachHangService } from './services/khach-hang.service';
import { KhachHangController } from './controllers/khach-hang.controller';

@Module({
    controllers: [CongViecController, KhachHangController],
    providers: [CongViecService, PhanCongService, KhachHangService],
    exports: [CongViecService, PhanCongService, KhachHangService],
})
export class TechMateModule { }
