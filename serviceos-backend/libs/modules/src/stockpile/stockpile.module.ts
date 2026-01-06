/**
 * ============================================================
 * STOCKPILE MODULE - Quản lý Kho Vật tư & Sản phẩm
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module này quản lý:
 * - Nhóm sản phẩm (NhomSanPham)
 * - Sản phẩm (SanPham)
 * - (Sau này) Kho, Tồn kho, Lịch sử kho
 */

import { Module } from '@nestjs/common';

// Controllers
import { SanPhamController } from './controllers/san-pham.controller';
import { NhomSanPhamController } from './controllers/nhom-san-pham.controller';

// Services
import { SanPhamService } from './services/san-pham.service';
import { NhomSanPhamService } from './services/nhom-san-pham.service';

@Module({
    controllers: [
        SanPhamController,
        NhomSanPhamController,
    ],
    providers: [
        SanPhamService,
        NhomSanPhamService,
    ],
    exports: [
        SanPhamService,
        NhomSanPhamService,
    ],
})
export class StockPileModule { }
