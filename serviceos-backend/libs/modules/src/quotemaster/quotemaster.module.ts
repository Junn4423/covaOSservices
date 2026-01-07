/**
 * ============================================================
 * QUOTEMASTER MODULE - Báo giá & Hợp đồng
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module này quản lý:
 * - Báo giá (BaoGia)
 * - Chi tiết báo giá (ChiTietBaoGia)
 * - Hợp đồng (HopDong)  Phase 6
 *
 * Features:
 * - Tạo báo giá với danh sách sản phẩm
 * - Tự động tính toán tiền (trước thuế, thuế, sau thuế)
 * - Quản lý trạng thái báo giá (DRAFT -> SENT -> ACCEPTED/REJECTED/EXPIRED)
 * - Snapshot giá sản phẩm tại thời điểm tạo báo giá
 * -  Convert báo giá -> hợp đồng
 * - Quản lý vòng đời hợp đồng (DRAFT -> ACTIVE -> LIQUIDATED/EXPIRED)
 */

import { Module } from '@nestjs/common';

// Controllers
import { BaoGiaController } from './controllers/bao-gia.controller';
import { HopDongController } from './controllers/hop-dong.controller';

// Services
import { BaoGiaService } from './services/bao-gia.service';
import { HopDongService } from './services/hop-dong.service';

@Module({
    controllers: [
        BaoGiaController,
        HopDongController,
    ],
    providers: [
        BaoGiaService,
        HopDongService,
    ],
    exports: [
        BaoGiaService,
        HopDongService,
    ],
})
export class QuoteMasterModule { }

