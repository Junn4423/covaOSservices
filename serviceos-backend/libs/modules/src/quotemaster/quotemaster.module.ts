/**
 * ============================================================
 * QUOTEMASTER MODULE - Báo giá & Hợp đồng
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module này quản lý:
 * - Báo giá (BaoGia)
 * - Chi tiết báo giá (ChiTietBaoGia)
 * - (Sau này) Hợp đồng (HopDong)
 *
 * Features:
 * - Tạo báo giá với danh sách sản phẩm
 * - Tự động tính toán tiền (trước thuế, thuế, sau thuế)
 * - Quản lý trạng thái báo giá (DRAFT -> SENT -> ACCEPTED/REJECTED/EXPIRED)
 * - Snapshot giá sản phẩm tại thời điểm tạo báo giá
 */

import { Module } from '@nestjs/common';

// Controllers
import { BaoGiaController } from './controllers/bao-gia.controller';

// Services
import { BaoGiaService } from './services/bao-gia.service';

@Module({
    controllers: [
        BaoGiaController,
    ],
    providers: [
        BaoGiaService,
    ],
    exports: [
        BaoGiaService,
    ],
})
export class QuoteMasterModule { }
