/**
 * ============================================================
 * TAI SAN CONTROLLER - AssetTrack Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Endpoints:
 * - POST   /assets              - Create new asset
 * - GET    /assets              - List assets (paginated + filtered)
 * - GET    /assets/count        - Count assets
 * - GET    /assets/history      - Get usage history
 * - GET    /assets/:id          - Get asset by ID
 * - PATCH  /assets/:id          - Update asset
 * - DELETE /assets/:id          - Soft delete asset
 * - POST   /assets/assign       - Assign asset to user
 * - POST   /assets/return       - Return asset from user
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
import { TaiSanService } from '../services/tai-san.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import {
    CreateTaiSanDto,
    UpdateTaiSanDto,
    QueryTaiSanDto,
    TaiSanResponseDto,
    TaiSanListResponseDto,
} from '../dto/tai-san.dto';
import {
    AssignAssetDto,
    ReturnAssetDto,
    QueryNhatKySuDungDto,
    AssetOperationResponseDto,
    NhatKySuDungListResponseDto,
} from '../dto/nhat-ky-su-dung.dto';

@ApiTags('AssetTrack - Tai San (Assets)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(
    TaiSanResponseDto,
    TaiSanListResponseDto,
    AssetOperationResponseDto,
    NhatKySuDungListResponseDto,
)
@Controller('assets')
export class TaiSanController {
    constructor(private readonly taiSanService: TaiSanService) { }

    // ============================================================
    // POST /assets - Create new asset
    // ============================================================
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create new asset',
        description: `
Create a new asset in the system.

**Features:**
- Auto-generate asset code if not provided
- Validate unique serial number per tenant
- Set initial status to AVAILABLE

**Asset Types Suggestions:**
Laptop, Desktop, Printer, Phone, Tablet, Vehicle, Tool, Furniture
        `,
    })
    @ApiBody({ type: CreateTaiSanDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Asset created successfully',
        type: TaiSanResponseDto,
    })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Serial number already exists' })
    async create(
        @Body() dto: CreateTaiSanDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.taiSanService.create(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // GET /assets - List assets
    // ============================================================
    @Get()
    @ApiOperation({
        summary: 'List assets',
        description: `
Get paginated list of assets with filters.

**Filters:**
- \`loai_tai_san\`: Filter by asset type
- \`trang_thai\`: 1=Available, 2=InUse, 3=Maintenance, 4=Lost, 5=Disposed
- \`nguoi_dang_giu\`: Filter by current holder (user ID)
- \`search\`: Search by name, code, or serial
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'List of assets',
        type: TaiSanListResponseDto,
    })
    async findAll(
        @Query() query: QueryTaiSanDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.taiSanService.findAll(user.id_doanh_nghiep, query);
    }

    // ============================================================
    // GET /assets/count - Count assets
    // ============================================================
    @Get('count')
    @ApiOperation({ summary: 'Count total assets' })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: { count: { type: 'number', example: 50 } },
        },
    })
    async count(@ActiveUser() user: ActiveUserData) {
        const count = await this.taiSanService.count(user.id_doanh_nghiep);
        return { count };
    }

    // ============================================================
    // GET /assets/history - Get usage history
    // ============================================================
    @Get('history')
    @ApiOperation({
        summary: 'Get asset usage history',
        description: `
Get history of asset assignments (loans).

**Filters:**
- \`tai_san_id\`: Filter by specific asset
- \`nguoi_muon_id\`: Filter by borrower
- \`chua_tra\`: true = only show active loans (not yet returned)
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Usage history',
        type: NhatKySuDungListResponseDto,
    })
    async getUsageHistory(
        @Query() query: QueryNhatKySuDungDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.taiSanService.getUsageHistory(user.id_doanh_nghiep, query);
    }

    // ============================================================
    // GET /assets/:id - Get asset by ID
    // ============================================================
    @Get(':id')
    @ApiOperation({
        summary: 'Get asset details',
        description: 'Get detailed information about an asset including current holder',
    })
    @ApiParam({ name: 'id', description: 'Asset UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: TaiSanResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Asset not found' })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.taiSanService.findOne(user.id_doanh_nghiep, id);
    }

    // ============================================================
    // PATCH /assets/:id - Update asset
    // ============================================================
    @Patch(':id')
    @ApiOperation({
        summary: 'Update asset',
        description: 'Update asset information',
    })
    @ApiParam({ name: 'id', description: 'Asset UUID' })
    @ApiBody({ type: UpdateTaiSanDto })
    @ApiResponse({ status: HttpStatus.OK, type: TaiSanResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Asset not found' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Serial number already exists' })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateTaiSanDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.taiSanService.update(user.id_doanh_nghiep, id, dto, user.id);
    }

    // ============================================================
    // DELETE /assets/:id - Soft delete asset
    // ============================================================
    @Delete(':id')
    @ApiOperation({
        summary: 'Delete asset (soft delete)',
        description: 'Soft delete an asset. Cannot delete if asset is currently on loan.',
    })
    @ApiParam({ name: 'id', description: 'Asset UUID' })
    @ApiResponse({ status: HttpStatus.OK, type: TaiSanResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Asset not found' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Asset is currently on loan' })
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.taiSanService.remove(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    // POST /assets/assign - Assign asset to user
    // ============================================================
    @Post('assign')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Assign asset to user',
        description: `
Assign an asset to a user (loan out).

**Business Rules:**
- Asset must be AVAILABLE status
- Asset must not be currently held by someone else
- Creates a usage log record (NhatKySuDung)
- Updates asset status to IN_USE
        `,
    })
    @ApiBody({ type: AssignAssetDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Asset assigned successfully',
        type: AssetOperationResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Asset or User not found' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Asset already assigned' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Asset not available' })
    async assignAsset(
        @Body() dto: AssignAssetDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.taiSanService.assignAsset(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // POST /assets/return - Return asset from user
    // ============================================================
    @Post('return')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Return asset from user',
        description: `
Return an asset (end loan).

**Business Rules:**
- Asset must have an active loan record
- Updates loan record with return date and condition
- Updates asset status back to AVAILABLE
        `,
    })
    @ApiBody({ type: ReturnAssetDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Asset returned successfully',
        type: AssetOperationResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Asset is not currently on loan' })
    async returnAsset(
        @Body() dto: ReturnAssetDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.taiSanService.returnAsset(user.id_doanh_nghiep, dto, user.id);
    }
}
