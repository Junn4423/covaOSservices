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

@ApiTags('AssetTrack - Tài sản (Assets)')
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
        summary: 'Tạo tài sản mới',
        description: `
Tạo một tài sản mới trong hệ thống.

**Tính năng:**
- Tự động tạo mã tài sản nếu không cung cấp
- Kiểm tra duy nhất số seri trong doanh nghiệp
- Đặt trạng thái ban đầu là AVAILABLE

**Gợi ý loại tài sản:**
Laptop, Desktop, Printer, Phone, Tablet, Vehicle, Tool, Furniture
        `,
    })
    @ApiBody({ type: CreateTaiSanDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Tài sản được tạo thành công',
        type: TaiSanResponseDto,
    })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Mã số seri đã tồn tại' })
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
Lấy danh sách tài sản với bộ lọc.

**Bộ lọc:**
- \`loai_tai_san\`: Lọc theo loại tài sản
- \`trang_thai\`: 1=Available, 2=InUse, 3=Maintenance, 4=Lost, 5=Disposed
- \`nguoi_dang_giu\`: Lọc theo người đang giữ (ID người dùng)
- \`search\`: Tìm kiếm theo tên, mã, hoặc số seri
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách tài sản',
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
        summary: 'Lấy lịch sử sử dụng tài sản',
        description: `
Lấy lịch sử các lần phân công tài sản (mượn).

**Bộ lọc:**
- \`tai_san_id\`: Lọc theo tài sản cụ thể
- \`nguoi_muon_id\`: Lọc theo người mượn
- \`chua_tra\`: true = chỉ hiển thị các khoản mượn đang hoạt động (chưa trả)
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lịch sử sử dụng',
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
        summary: 'Lấy chi tiết tài sản',
        description: 'Lấy thông tin chi tiết về tài sản bao gồm người đang giữ',
    })
    @ApiParam({ name: 'id', description: 'UUID tài sản' })
    @ApiResponse({ status: HttpStatus.OK, type: TaiSanResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy tài sản' })
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
        summary: 'Cập nhật tài sản',
        description: 'Cập nhật thông tin tài sản',
    })
    @ApiParam({ name: 'id', description: 'UUID tài sản' })
    @ApiBody({ type: UpdateTaiSanDto })
    @ApiResponse({ status: HttpStatus.OK, type: TaiSanResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy tài sản' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Mã số seri đã tồn tại' })
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
        summary: 'Xóa tài sản (xóa mềm)',
        description: 'Xóa mềm tài sản. Không thể xóa nếu tài sản đang được mượn.',
    })
    @ApiParam({ name: 'id', description: 'UUID tài sản' })
    @ApiResponse({ status: HttpStatus.OK, type: TaiSanResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy tài sản' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Tài sản đang được mượn' })
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
        summary: 'Phân công tài sản cho người dùng',
        description: `
Phân công tài sản cho người dùng (cho mượn).

**Quy tắc nghiệp vụ:**
- Tài sản phải ở trạng thái AVAILABLE
- Tài sản không được đang được giữ bởi người khác
- Tạo bản ghi nhật ký sử dụng (NhatKySuDung)
- Cập nhật trạng thái tài sản thành IN_USE
        `,
    })
    @ApiBody({ type: AssignAssetDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tài sản đã được phân công thành công',
        type: AssetOperationResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy tài sản hoặc người dùng' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Tài sản đã được phân công' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Tài sản không khả dụng' })
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
        summary: 'Trả tài sản từ người dùng',
        description: `
Trả lại tài sản (kết thúc việc mượn).

**Quy tắc nghiệp vụ:**
- Tài sản phải có bản ghi mượn đang hoạt động
- Cập nhật bản ghi mượn với ngày trả và tình trạng
- Cập nhật trạng thái tài sản về AVAILABLE
        `,
    })
    @ApiBody({ type: ReturnAssetDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tài sản đã được trả thành công',
        type: AssetOperationResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Tài sản hiện không được mượn' })
    async returnAsset(
        @Body() dto: ReturnAssetDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.taiSanService.returnAsset(user.id_doanh_nghiep, dto, user.id);
    }
}
