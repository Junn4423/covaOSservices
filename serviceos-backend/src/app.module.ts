/**
 * ============================================================
 * APP MODULE - Root Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module chính kết nối tất cả các modules của hệ thống.
 *
 * CLS MIDDLEWARE:
 * - ClsModule được setup ở đây với global middleware
 * - Tất cả requests sẽ tự động có CLS context
 * - JwtAuthGuard sẽ set userId/tenantId vào context
 * - PrismaService đọc từ context để filter theo tenant
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { APP_GUARD } from '@nestjs/core';

// Core Libraries
import { DatabaseModule } from '@libs/database';
import { CommonModule, JwtAuthGuard, JwtStrategy } from '@libs/common';

// Business Modules
import {
    CoreModule,
    TechMateModule,
    StockPileModule,
    QuoteMasterModule,
    ShiftSquadModule,
    AssetTrackModule,
    RouteOptimaModule,
    // Uncomment khi implement cac module khac:
    // CashFlowModule,
    // CustomerPortalModule,
    // ProcurePoolModule,
    // NotificationModule,
    // BillingModule,
} from '@libs/modules';

// App
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
    imports: [
        // Environment Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),

        // CLS Module - Async Local Storage for Multi-tenant Context
        ClsModule.forRoot({
            global: true,
            middleware: {
                mount: true,
                // generateId: true,
            },
        }),

        // Database - Global PrismaService
        DatabaseModule,

        // Common - Guards, Strategies, Filters
        CommonModule,

        // Business Modules
        CoreModule,
        TechMateModule,
        StockPileModule,
        QuoteMasterModule,  // Phase 5: Bao gia
        ShiftSquadModule,   // Phase 11: HR & Timekeeping
        AssetTrackModule,   // Phase 12: Asset Management
        RouteOptimaModule,  // Phase 12: Route Management
    ],
    controllers: [AppController],
    providers: [
        AppService,
        JwtStrategy,
        // Global JWT Guard - tất cả routes yêu cầu auth trừ @Public()
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule { }
