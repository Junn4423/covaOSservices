/**
 * ============================================================
 * CA LAM VIEC CONTROLLER - ShiftSquad Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Endpoints:
 * - POST   /shifts          - Create new shift
 * - GET    /shifts          - List all shifts
 * - GET    /shifts/current  - Get current applicable shift
 * - GET    /shifts/:id      - Get shift by ID
 * - PATCH  /shifts/:id      - Update shift
 * - DELETE /shifts/:id      - Soft delete shift
 * - PATCH  /shifts/:id/restore - Restore deleted shift
 */

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
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
import { CaLamViecService } from '../services/ca-lam-viec.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import {
    CreateCaLamViecDto,
    UpdateCaLamViecDto,
    QueryCaLamViecDto,
    CaLamViecResponseDto,
    CaLamViecListResponseDto,
} from '../dto/ca-lam-viec.dto';

@ApiTags('ShiftSquad - Ca Lam Viec (Shifts)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(CaLamViecResponseDto, CaLamViecListResponseDto)
@Controller('shifts')
export class CaLamViecController {
    constructor(private readonly caLamViecService: CaLamViecService) { }

    // ============================================================
    // POST /shifts - Create new shift
    // ============================================================
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create new work shift',
        description: `
Create a new work shift configuration.

**Input:**
- \`ten_ca\`: Shift name (e.g., "Ca Sang", "Ca Chieu")
- \`gio_bat_dau\`: Start time in HH:mm format (24-hour)
- \`gio_ket_thuc\`: End time in HH:mm format (24-hour)
- \`ap_dung_thu\`: Days of week (comma-separated: 2=Mon, 3=Tue, ..., 8=Sun)

**Example:**
- Morning shift: 08:00 - 12:00, Mon-Fri: "2,3,4,5,6"
- Afternoon shift: 13:00 - 17:00, Mon-Sat: "2,3,4,5,6,7"
        `,
    })
    @ApiBody({ type: CreateCaLamViecDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Shift created successfully',
        type: CaLamViecResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data or time format' })
    async create(
        @Body() dto: CreateCaLamViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.create(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // GET /shifts - List all shifts
    // ============================================================
    @Get()
    @ApiOperation({
        summary: 'List all work shifts',
        description: `
Get all configured work shifts for the tenant.

**Features:**
- Pagination: page, limit
- Filter by status (active/inactive)
- Search by name
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of shifts',
        type: CaLamViecListResponseDto,
    })
    async findAll(
        @Query() query: QueryCaLamViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.findAll(user.id_doanh_nghiep, query);
    }

    // ============================================================
    // GET /shifts/current - Get current applicable shift
    // ============================================================
    @Get('current')
    @ApiOperation({
        summary: 'Get current applicable shift',
        description: `
Determine which shift applies to the current time and day of week.

**Logic:**
1. Check current local time
2. Check current day of week
3. Find active shift that matches both criteria
4. Return shift info or null if no match

Useful for:
- Mobile app to show which shift the user should be in
- Auto-detecting shift for check-in/check-out
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Current shift or null',
        schema: {
            oneOf: [
                { $ref: '#/components/schemas/CaLamViecResponseDto' },
                { type: 'null' },
            ],
        },
    })
    async getCurrentShift(@ActiveUser() user: ActiveUserData) {
        return this.caLamViecService.getCurrentShift(user.id_doanh_nghiep);
    }

    // ============================================================
    // GET /shifts/:id - Get shift by ID
    // ============================================================
    @Get(':id')
    @ApiOperation({
        summary: 'Get shift details',
        description: 'Get detailed information about a specific shift',
    })
    @ApiParam({ name: 'id', description: 'Shift UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: CaLamViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Shift not found' })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.findOne(user.id_doanh_nghiep, id);
    }

    // ============================================================
    // PATCH /shifts/:id - Update shift
    // ============================================================
    @Patch(':id')
    @ApiOperation({
        summary: 'Update shift',
        description: `
Update an existing shift configuration.

**Updatable fields:**
- \`ten_ca\`: Shift name
- \`gio_bat_dau\`: Start time (HH:mm)
- \`gio_ket_thuc\`: End time (HH:mm)
- \`ap_dung_thu\`: Days of week
- \`trang_thai\`: Status (1=Active, 0=Inactive)
        `,
    })
    @ApiParam({ name: 'id', description: 'Shift UUID' })
    @ApiBody({ type: UpdateCaLamViecDto })
    @ApiResponse({ status: HttpStatus.OK, type: CaLamViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Shift not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid data' })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateCaLamViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.update(user.id_doanh_nghiep, id, dto, user.id);
    }

    // ============================================================
    // DELETE /shifts/:id - Soft delete shift
    // ============================================================
    @Delete(':id')
    @ApiOperation({
        summary: 'Delete shift (soft delete)',
        description: `
Soft delete a shift. The shift can be restored later.

Note: Deleting a shift does not affect existing attendance records.
        `,
    })
    @ApiParam({ name: 'id', description: 'Shift UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: CaLamViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Shift not found' })
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.remove(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    // PATCH /shifts/:id/restore - Restore deleted shift
    // ============================================================
    @Patch(':id/restore')
    @ApiOperation({
        summary: 'Restore deleted shift',
        description: 'Restore a previously soft-deleted shift',
    })
    @ApiParam({ name: 'id', description: 'Shift UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: CaLamViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Deleted shift not found' })
    async restore(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.restore(user.id_doanh_nghiep, id, user.id);
    }
}
