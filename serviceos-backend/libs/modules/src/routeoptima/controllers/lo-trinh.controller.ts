/**
 * ============================================================
 * LO TRINH CONTROLLER - RouteOptima Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Endpoints:
 * - POST   /routes                     - Create route with stops
 * - GET    /routes                     - List routes (paginated)
 * - GET    /routes/my-route            - Get my route for today/date
 * - GET    /routes/:id                 - Get route by ID
 * - PATCH  /routes/:id/start           - Start route
 * - PATCH  /routes/:id/cancel          - Cancel route
 * - PATCH  /routes/:id/optimize        - Optimize route order
 * - DELETE /routes/:id                 - Soft delete route
 * - PATCH  /routes/stops/:id/status    - Update stop status
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
import { LoTrinhService } from '../services/lo-trinh.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import {
    CreateLoTrinhDto,
    QueryLoTrinhDto,
    QueryMyRouteDto,
    LoTrinhResponseDto,
    LoTrinhListResponseDto,
} from '../dto/lo-trinh.dto';
import { UpdateStopStatusDto, UpdateStopResponseDto } from '../dto/diem-dung.dto';

@ApiTags('RouteOptima - Lo Trinh (Routes)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(LoTrinhResponseDto, LoTrinhListResponseDto, UpdateStopResponseDto)
@Controller('routes')
export class LoTrinhController {
    constructor(private readonly loTrinhService: LoTrinhService) { }

    // ============================================================
    // POST /routes - Create route with stops
    // ============================================================
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create route with stops',
        description: `
Create a new route with multiple stops for a staff member.

**Input:**
- \`ngay_lo_trinh\`: Date (YYYY-MM-DD)
- \`nguoi_dung_id\`: Staff/Driver user ID
- \`stops\`: Array of stop items (at least 1 required)
  - \`thu_tu\`: Stop order (1, 2, 3...)
  - \`dia_chi\`: Address
  - \`toa_do_lat\`, \`toa_do_lng\`: GPS coordinates
  - \`thoi_gian_den_du_kien\`: Expected arrival time
  - \`cong_viec_id\`: Related job ID (optional)
  - \`ghi_chu\`: Notes

**Creates:**
- LoTrinh (Route header)
- DiemDung records (Stops)
        `,
    })
    @ApiBody({ type: CreateLoTrinhDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Route created successfully',
        type: LoTrinhResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User or Job not found' })
    async create(
        @Body() dto: CreateLoTrinhDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.createRoute(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // GET /routes - List routes
    // ============================================================
    @Get()
    @ApiOperation({
        summary: 'List routes',
        description: `
Get paginated list of routes.

**Filters:**
- \`ngay\`: Filter by date (YYYY-MM-DD)
- \`nguoi_dung_id\`: Filter by staff ID
- \`trang_thai\`: 0=Pending, 1=InProgress, 2=Completed, 3=Cancelled
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of routes',
        type: LoTrinhListResponseDto,
    })
    async findAll(
        @Query() query: QueryLoTrinhDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.findAll(user.id_doanh_nghiep, query);
    }

    // ============================================================
    // GET /routes/my-route - Get my route for today
    // ============================================================
    @Get('my-route')
    @ApiOperation({
        summary: 'Get my route for today',
        description: `
Get the route assigned to the current logged-in user.

**Input:**
- \`ngay\`: Optional date (YYYY-MM-DD). Defaults to today.

**Output:**
- Route with all stops ordered by \`thu_tu\`
- null if no route for the date
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'My route data',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/LoTrinhResponseDto' },
            },
        },
    })
    async getMyRoute(
        @Query() query: QueryMyRouteDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.getMyRoute(user.id_doanh_nghiep, query, user.id);
    }

    // ============================================================
    // GET /routes/:id - Get route by ID
    // ============================================================
    @Get(':id')
    @ApiOperation({
        summary: 'Get route details',
        description: 'Get route with all stops',
    })
    @ApiParam({ name: 'id', description: 'Route UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: LoTrinhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Route not found' })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.findOne(user.id_doanh_nghiep, id);
    }

    // ============================================================
    // PATCH /routes/:id/start - Start route
    // ============================================================
    @Patch(':id/start')
    @ApiOperation({
        summary: 'Start route',
        description: 'Mark route as started (IN_PROGRESS). Records start time.',
    })
    @ApiParam({ name: 'id', description: 'Route UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: LoTrinhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Route not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Route already started' })
    async startRoute(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.startRoute(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    // PATCH /routes/:id/cancel - Cancel route
    // ============================================================
    @Patch(':id/cancel')
    @ApiOperation({
        summary: 'Cancel route',
        description: 'Cancel a route. Cannot cancel completed routes.',
    })
    @ApiParam({ name: 'id', description: 'Route UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: LoTrinhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Route not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Cannot cancel completed route' })
    async cancelRoute(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.cancelRoute(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    // PATCH /routes/:id/optimize - Optimize route
    // ============================================================
    @Patch(':id/optimize')
    @ApiOperation({
        summary: 'Optimize route order',
        description: `
Re-order stops for optimal route.

**Current Implementation:**
- Placeholder - sorts by existing \`thu_tu\`

**Future:**
- TSP (Traveling Salesman Problem) algorithm
- Uses GPS coordinates to minimize travel distance
        `,
    })
    @ApiParam({ name: 'id', description: 'Route UUID' })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/LoTrinhResponseDto' },
                note: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Route not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Route already started' })
    async optimizeRoute(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.optimizeRoute(user.id_doanh_nghiep, id);
    }

    // ============================================================
    // DELETE /routes/:id - Soft delete route
    // ============================================================
    @Delete(':id')
    @ApiOperation({
        summary: 'Delete route (soft delete)',
        description: 'Soft delete a route and all its stops.',
    })
    @ApiParam({ name: 'id', description: 'Route UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: LoTrinhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Route not found' })
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.remove(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    // PATCH /routes/stops/:id/status - Update stop status
    // ============================================================
    @Patch('stops/:id/status')
    @ApiOperation({
        summary: 'Update stop status',
        description: `
Mark a stop as Visited or Skipped.

**Input:**
- \`trang_thai\`: 1 = Visited, 2 = Skipped
- \`thoi_gian_den_thuc_te\`: Actual arrival time (optional, defaults to now)
- \`toa_do_thuc_te_lat\`, \`toa_do_thuc_te_lng\`: Actual GPS (optional)
- \`thoi_gian_roi_di\`: Departure time (optional)

**Behavior:**
- If route status is PENDING, it becomes IN_PROGRESS
- If all stops are Visited/Skipped, route becomes COMPLETED
        `,
    })
    @ApiParam({ name: 'id', description: 'Stop UUID (DiemDung)' })
    @ApiBody({ type: UpdateStopStatusDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Stop updated',
        type: UpdateStopResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Stop not found' })
    async updateStopStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateStopStatusDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.updateStopStatus(user.id_doanh_nghiep, id, dto, user.id);
    }
}
