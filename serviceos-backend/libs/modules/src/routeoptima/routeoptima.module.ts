/**
 * ============================================================
 * ROUTEOPTIMA MODULE - Route Management
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module for managing daily routes:
 * - Create routes with stops
 * - Track stop visits
 * - Optimize route order (placeholder for TSP)
 * - Staff route assignment
 *
 * Phase 12: RouteOptima - Route Management
 */

import { Module } from '@nestjs/common';

// Controllers
import { LoTrinhController } from './controllers/lo-trinh.controller';

// Services
import { LoTrinhService } from './services/lo-trinh.service';

@Module({
    controllers: [LoTrinhController],
    providers: [LoTrinhService],
    exports: [LoTrinhService],
})
export class RouteOptimaModule { }
