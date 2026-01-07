/**
 * ============================================================
 * STOCKPILE MODULE - Quản lý Kho Vật tư & Sản phẩm
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module này quản lý:
 * - Nhóm sản phẩm (NhomSanPham)
 * - Sản phẩm (SanPham)
 * - Kho hàng (Kho) - Warehouse Management
 * - Tồn kho (TonKho) - Inventory Management
 * - Lịch sử kho (LichSuKho) - Audit Trail
 *
 * Phase 9: StockPile Advanced - Warehouse & Inventory
 */

import { Module } from '@nestjs/common';

// Controllers
import { SanPhamController } from './controllers/san-pham.controller';
import { NhomSanPhamController } from './controllers/nhom-san-pham.controller';
import { KhoController } from './controllers/kho.controller';
import { TonKhoController } from './controllers/ton-kho.controller';

// Services
import { SanPhamService } from './services/san-pham.service';
import { NhomSanPhamService } from './services/nhom-san-pham.service';
import { KhoService } from './services/kho.service';
import { TonKhoService } from './services/ton-kho.service';

@Module({
    controllers: [
        SanPhamController,
        NhomSanPhamController,
        KhoController,
        TonKhoController,
    ],
    providers: [
        SanPhamService,
        NhomSanPhamService,
        KhoService,
        TonKhoService,
    ],
    exports: [
        SanPhamService,
        NhomSanPhamService,
        KhoService,
        TonKhoService,
    ],
})
export class StockPileModule { }
