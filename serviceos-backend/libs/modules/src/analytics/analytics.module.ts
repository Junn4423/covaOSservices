/**
 * ============================================================
 * ANALYTICS MODULE - Module Dashboard phan tich
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Phase 15: Analytics Dashboard
 *
 * CHUC NANG:
 * - Thong ke tong quan (doanh thu, khach hang, cong viec, bao gia)
 * - Bieu do doanh thu theo thang/tuan
 * - San pham ban chay
 * - Hieu suat nhan vien ky thuat
 *
 * TOI UU HOA:
 * - Tich hop CacheModule voi TTL 5-10 phut
 * - Su dung Prisma aggregate va $queryRaw cho hieu suat cao
 *
 * BAO MAT:
 * - Chi Admin moi duoc truy cap (thong qua RolesGuard)
 */

import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsService } from './services/analytics.service';

@Module({
    imports: [
        // Cache Module cho Analytics
        // TTL mac dinh: 300 giay (5 phut)
        // Max items: 100 entries
        CacheModule.register({
            ttl: 300,
            max: 100,
        }),
    ],
    controllers: [AnalyticsController],
    providers: [AnalyticsService],
    exports: [AnalyticsService],
})
export class AnalyticsModule {}
