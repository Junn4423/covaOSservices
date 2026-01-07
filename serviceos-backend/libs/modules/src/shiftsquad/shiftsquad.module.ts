/**
 * ============================================================
 * SHIFTSQUAD MODULE - HR & Timekeeping
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module nay quan ly:
 * - Ca Lam Viec (CaLamViec) - Work Shift Management
 * - Cham Cong (ChamCong) - Employee Timekeeping / Attendance
 *
 * Phase 11: ShiftSquad - HR & Timekeeping
 *
 * Features:
 * - Shift configuration (start/end time, applicable days)
 * - Employee check-in/check-out with GPS tracking
 * - Personal timesheet by month
 * - Daily attendance report for managers
 * - Late/early detection based on shift times
 */

import { Module } from '@nestjs/common';

// Controllers
import { CaLamViecController } from './controllers/ca-lam-viec.controller';
import { ChamCongController } from './controllers/cham-cong.controller';

// Services
import { CaLamViecService } from './services/ca-lam-viec.service';
import { ChamCongService } from './services/cham-cong.service';

@Module({
    controllers: [
        CaLamViecController,
        ChamCongController,
    ],
    providers: [
        CaLamViecService,
        ChamCongService,
    ],
    exports: [
        CaLamViecService,
        ChamCongService,
    ],
})
export class ShiftSquadModule { }
