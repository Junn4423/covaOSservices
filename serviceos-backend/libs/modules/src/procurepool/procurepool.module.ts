/**
 * ============================================================
 * PROCUREPOOL MODULE - Mua sắm B2B (Procurement)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module này quản lý:
 * - Nhà cung cấp (NhaCungCap) - Supplier Management
 * - Đơn đặt hàng NCC (DonDatHangNcc) - Purchase Order Management
 * - Quy trình Nhập hàng (PO -> Goods Receipt)
 *
 * Integration:
 * - StockPileModule: Gọi TonKhoService.nhapKho khi nhận hàng
 *
 * Phase 10: ProcurePool - Procurement Management
 */

import { Module, forwardRef } from '@nestjs/common';

// Import StockPileModule để sử dụng TonKhoService
import { StockPileModule } from '../stockpile/stockpile.module';

// Controllers
import { NhaCungCapController } from './controllers/nha-cung-cap.controller';
import { DonDatHangController } from './controllers/don-dat-hang.controller';

// Services
import { NhaCungCapService } from './services/nha-cung-cap.service';
import { DonDatHangService } from './services/don-dat-hang.service';

@Module({
    imports: [
        // Import StockPileModule để inject TonKhoService
        forwardRef(() => StockPileModule),
    ],
    controllers: [
        NhaCungCapController,
        DonDatHangController,
    ],
    providers: [
        NhaCungCapService,
        DonDatHangService,
    ],
    exports: [
        NhaCungCapService,
        DonDatHangService,
    ],
})
export class ProcurePoolModule { }

