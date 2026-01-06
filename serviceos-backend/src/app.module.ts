/**
 * ============================================================
 * API GATEWAY - Main Application Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * This is the entry point for all API requests.
 * It imports all 12 business modules and sets up:
 * - Global Authentication via JWT
 * - Multi-tenant Row-Level Security via PrismaService (Scope.REQUEST)
 * - Standardized Response Format
 * - Swagger API Documentation
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Database
import { DatabaseModule } from '@libs/database';

// Common (Guards, Interceptors, Filters)
import {
  CommonModule,
  JwtAuthGuard,
  RolesGuard,
  ResponseInterceptor,
  AllExceptionsFilter,
} from '@libs/common';

// Business Modules
import { CoreModule } from '@libs/modules/core';
import { TechMateModule } from '@libs/modules/techmate';
import { StockPileModule } from '@libs/modules/stockpile';
import { ShiftSquadModule } from '@libs/modules/shiftsquad';
import { AssetTrackModule } from '@libs/modules/assettrack';
import { RouteOptimaModule } from '@libs/modules/routeoptima';
import { QuoteMasterModule } from '@libs/modules/quotemaster';
import { CashFlowModule } from '@libs/modules/cashflow';
import { CustomerPortalModule } from '@libs/modules/customerportal';
import { ProcurePoolModule } from '@libs/modules/procurepool';
import { NotificationModule } from '@libs/modules/notification';
import { BillingModule } from '@libs/modules/billing';

@Module({
  imports: [
    // ============================================================
    // Configuration
    // ============================================================
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ============================================================
    // Infrastructure Modules
    // ============================================================
    DatabaseModule,   // PrismaService với Scope.REQUEST cho multi-tenant
    CommonModule,     // JWT, Guards, Decorators

    // ============================================================
    // Business Modules - 12 Modules
    // ============================================================
    CoreModule,           // Auth, User, Tenant
    TechMateModule,       // Jobs, Assignments, Customers
    StockPileModule,      // Inventory, Products, Warehouse
    ShiftSquadModule,     // Attendance, Shifts
    AssetTrackModule,     // Assets, Usage Log
    RouteOptimaModule,    // Routes, Stops
    QuoteMasterModule,    // Quotes, Contracts
    CashFlowModule,       // Income/Expense
    CustomerPortalModule, // Customer Portal, Reviews
    ProcurePoolModule,    // Suppliers, Purchase Orders
    NotificationModule,   // Notifications
    BillingModule,        // SaaS Billing
  ],

  providers: [
    // ============================================================
    // Global Guards
    // ============================================================
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // ============================================================
    // Global Interceptors
    // ============================================================
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // ============================================================
    // Global Exception Filters
    // ============================================================
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule { }
