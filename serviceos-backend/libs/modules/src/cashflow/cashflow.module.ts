/**
 * ============================================================
 * CASHFLOW MODULE - Thu chi nội bộ
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module này quản lý:
 * - Phiếu thu (PT-xxx)
 * - Phiếu chi (PC-xxx)
 * - Thống kê dòng tiền (Dashboard)
 * - Báo cáo tài chính theo danh mục
 *
 * Features:
 * - Tự động sinh mã phiếu theo loại (PT/PC)
 * - Phân loại theo danh mục
 * - Liên kết với Công việc, Khách hàng
 * - Thống kê aggregate tối ưu performance
 * - Soft delete với khả năng restore
 */

import { Module } from '@nestjs/common';

// Controllers
import { PhieuThuChiController } from './controllers/phieu-thu-chi.controller';

// Services
import { PhieuThuChiService } from './services/phieu-thu-chi.service';

@Module({
    controllers: [
        PhieuThuChiController,
    ],
    providers: [
        PhieuThuChiService,
    ],
    exports: [
        PhieuThuChiService,
    ],
})
export class CashFlowModule { }
