/**
 * ============================================================
 * ASSETTRACK MODULE - Asset Management
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module for managing internal assets:
 * - CRUD operations for assets (TaiSan)
 * - Asset assignment to users
 * - Asset return from users
 * - Usage history tracking (NhatKySuDung)
 *
 * Phase 12: AssetTrack - Asset Management
 */

import { Module } from '@nestjs/common';

// Controllers
import { TaiSanController } from './controllers/tai-san.controller';

// Services
import { TaiSanService } from './services/tai-san.service';

@Module({
    controllers: [TaiSanController],
    providers: [TaiSanService],
    exports: [TaiSanService],
})
export class AssetTrackModule { }
