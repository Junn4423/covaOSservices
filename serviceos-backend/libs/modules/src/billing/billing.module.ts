/**
 * ============================================================
 * BILLING MODULE - Quản lý Gói cước SaaS
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Phase 14: Quản lý Gói cước SaaS
 *
 * CHỨC NĂNG:
 * - Quản lý gói cước (TRIAL, BASIC, PRO, ENTERPRISE)
 * - Nâng cấp / gia hạn gói cước
 * - Lịch sử thanh toán
 * - Khóa tenant hết hạn
 */
import { Module } from '@nestjs/common';
import { BillingController } from './controllers/billing.controller';
import { BillingService } from './services/billing.service';

@Module({
    controllers: [BillingController],
    providers: [BillingService],
    exports: [BillingService],
})
export class BillingModule {}
