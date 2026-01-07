/**
 * ============================================================
 * CHAM CONG CONTROLLER - ShiftSquad Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Endpoints:
 * - POST   /attendance/check-in      - Employee check-in
 * - POST   /attendance/check-out     - Employee check-out
 * - GET    /attendance/today         - Get today's status (quick check)
 * - GET    /attendance/my-timesheet  - Personal timesheet by month/year
 * - GET    /attendance/daily-report  - Manager: All employees for a day
 * - GET    /attendance/:id           - Get attendance record by ID
 */

import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    HttpStatus,
    HttpCode,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiBody,
    ApiExtraModels,
} from '@nestjs/swagger';
import { ChamCongService } from '../services/cham-cong.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import {
    CheckInDto,
    CheckOutDto,
    QueryTimesheetDto,
    QueryDailyReportDto,
    ChamCongResponseDto,
    CheckInResponseDto,
    CheckOutResponseDto,
    TimesheetResponseDto,
    DailyReportResponseDto,
} from '../dto/cham-cong.dto';

@ApiTags('ShiftSquad - Cham Cong (Attendance)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(
    ChamCongResponseDto,
    CheckInResponseDto,
    CheckOutResponseDto,
    TimesheetResponseDto,
    DailyReportResponseDto,
)
@Controller('attendance')
export class ChamCongController {
    constructor(private readonly chamCongService: ChamCongService) { }

    // ============================================================
    // POST /attendance/check-in - Employee check-in
    // ============================================================
    @Post('check-in')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Employee check-in',
        description: `
Employee clock-in for the day.

**Features:**
- Auto-detects current shift based on time and day
- Prevents double check-in (only one check-in per day)
- Tracks GPS coordinates for location verification
- Supports check-in photo (selfie URL)
- Automatically marks as "Late" if check-in is 15+ minutes after shift start

**Input:**
- \`toa_do_lat\`: Latitude (-90 to 90)
- \`toa_do_lng\`: Longitude (-180 to 180)
- \`anh_checkin\`: Photo URL (optional)
- \`ghi_chu\`: Notes (optional)

**Output:**
- Check-in confirmation with timestamp
- Detected shift information (if applicable)
- Attendance record
        `,
    })
    @ApiBody({ type: CheckInDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Check-in successful',
        type: CheckInResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Already checked in today',
    })
    async checkIn(
        @Body() dto: CheckInDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.checkIn(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // POST /attendance/check-out - Employee check-out
    // ============================================================
    @Post('check-out')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Employee check-out',
        description: `
Employee clock-out for the day.

**Requirements:**
- Must have checked in first
- Cannot check-out multiple times

**Features:**
- Updates check-out time, location, and photo
- Calculates total working hours
- Marks as "Early Leave" if check-out is 15+ minutes before shift end

**Input:**
- \`toa_do_lat\`: Latitude (-90 to 90)
- \`toa_do_lng\`: Longitude (-180 to 180)
- \`anh_checkout\`: Photo URL (optional)

**Output:**
- Check-out confirmation with timestamp
- Calculated working hours
- Updated attendance record
        `,
    })
    @ApiBody({ type: CheckOutDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Check-out successful',
        type: CheckOutResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Not checked in or already checked out',
    })
    async checkOut(
        @Body() dto: CheckOutDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.checkOut(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // GET /attendance/today - Quick status check
    // ============================================================
    @Get('today')
    @ApiOperation({
        summary: 'Get today attendance status',
        description: `
Quick check for today's attendance status.

Useful for mobile app to determine:
- Should show "Check-in" button? (not checked in yet)
- Should show "Check-out" button? (checked in but not out)
- Already completed for today? (both done)

**Output:**
- \`status\`: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT'
- \`can_checkin\`: boolean
- \`can_checkout\`: boolean
- \`data\`: Attendance record (if exists)
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['NOT_CHECKED_IN', 'CHECKED_IN', 'CHECKED_OUT'],
                },
                can_checkin: { type: 'boolean' },
                can_checkout: { type: 'boolean' },
                data: { $ref: '#/components/schemas/ChamCongResponseDto' },
            },
        },
    })
    async getTodayStatus(@ActiveUser() user: ActiveUserData) {
        return this.chamCongService.getTodayStatus(user.id_doanh_nghiep, user.id);
    }

    // ============================================================
    // GET /attendance/my-timesheet - Personal timesheet
    // ============================================================
    @Get('my-timesheet')
    @ApiOperation({
        summary: 'Get personal timesheet',
        description: `
Get attendance records for a specific month/year.

**Input:**
- \`thang\`: Month (1-12)
- \`nam\`: Year (e.g., 2026)

**Output:**
- List of attendance records for the month
- Summary statistics:
  - \`tong_ngay_lam\`: Total working days
  - \`tong_gio_lam\`: Total working hours
  - \`so_ngay_di_tre\`: Number of late days
  - \`so_ngay_vang\`: Number of absent days
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Timesheet data',
        type: TimesheetResponseDto,
    })
    async getMyTimesheet(
        @Query() query: QueryTimesheetDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.getMyTimesheet(user.id_doanh_nghiep, query, user.id);
    }

    // ============================================================
    // GET /attendance/daily-report - Manager view
    // ============================================================
    @Get('daily-report')
    @ApiOperation({
        summary: 'Get daily attendance report (Manager)',
        description: `
Get attendance status for all employees on a specific date.

**For Manager/Admin use.**

**Input:**
- \`ngay\`: Date (YYYY-MM-DD format)
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 50)

**Output:**
- List of employees with their status:
  - \`trang_thai_text\`: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'NOT_CHECKED_IN'
  - Check-in/out times
  - Working hours
  - Shift info
- Summary:
  - \`tong_nhan_vien\`: Total employees
  - \`co_mat\`: Present count
  - \`vang_mat\`: Absent count
  - \`di_tre\`: Late count
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Daily report data',
        type: DailyReportResponseDto,
    })
    async getDailyReport(
        @Query() query: QueryDailyReportDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.getDailyReport(user.id_doanh_nghiep, query);
    }

    // ============================================================
    // GET /attendance/:id - Get record by ID
    // ============================================================
    @Get(':id')
    @ApiOperation({
        summary: 'Get attendance record by ID',
        description: 'Get detailed information about a specific attendance record',
    })
    @ApiParam({ name: 'id', description: 'Attendance record UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: ChamCongResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Record not found' })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.findOne(user.id_doanh_nghiep, id);
    }
}
