/**
 * ============================================================
 * PHIẾU THU CHI CONTROLLER - CashFlow Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Endpoints:
 * - POST   /cashflow       - Tạo phiếu thu/chi mới
 * - GET    /cashflow       - Danh sách phiếu (phân trang + filter)
 * - GET    /cashflow/stats - Thống kê dòng tiền cho Dashboard
 * - GET    /cashflow/stats/category - Thống kê theo danh mục
 * - GET    /cashflow/count - Đếm tổng số phiếu
 * - GET    /cashflow/:id   - Chi tiết phiếu
 * - PATCH  /cashflow/:id   - Cập nhật phiếu
 * - DELETE /cashflow/:id   - Xóa phiếu (soft delete)
 * - PATCH  /cashflow/:id/restore - Khôi phục phiếu đã xóa
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
import { PhieuThuChiService } from '../services/phieu-thu-chi.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import {
    CreatePhieuThuChiDto,
    UpdatePhieuThuChiDto,
    QueryPhieuThuChiDto,
    CashFlowStatsQueryDto,
    PhieuThuChiResponseDto,
    PhieuThuChiListResponseDto,
    CashFlowStatsResponseDto,
    LoaiPhieuThuChi,
    PhuongThucTT,
} from '../dto/phieu-thu-chi.dto';

@ApiTags('CashFlow - Phiếu Thu Chi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(PhieuThuChiResponseDto, PhieuThuChiListResponseDto, CashFlowStatsResponseDto)
@Controller('cashflow')
export class PhieuThuChiController {
    constructor(private readonly phieuThuChiService: PhieuThuChiService) { }

    // ============================================================
    // POST /cashflow - Tạo phiếu thu/chi mới
    // ============================================================
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Tạo phiếu thu/chi mới',
        description: `
Tạo phiếu thu hoặc phiếu chi mới.

**Tính năng tự động:**
- \`ma_phieu\` tự động generate:
  - Phiếu Thu: **PT-{Timestamp}** (VD: PT-1704585600000)
  - Phiếu Chi: **PC-{Timestamp}** (VD: PC-1704585600000)
- \`ngay_thuc_hien\` mặc định là hôm nay nếu không gửi
- \`id_nguoi_dung\` (người tạo) lấy từ JWT token

**Validation:**
- \`so_tien\` phải > 0
- \`id_cong_viec\` nếu có phải tồn tại trong hệ thống
- \`id_khach_hang\` nếu có phải tồn tại trong hệ thống

**Danh mục gợi ý:**
- Thu: Thanh toán hợp đồng, Thu tiền dịch vụ, Thu tạm ứng...
- Chi: Tiền điện, Lương, Chi phí văn phòng, Mua vật tư...
        `,
    })
    @ApiBody({ type: CreatePhieuThuChiDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Phiếu thu/chi được tạo thành công',
        type: PhieuThuChiResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu không hợp lệ / Số tiền <= 0' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Công việc hoặc khách hàng không tồn tại' })
    async create(
        @Body() dto: CreatePhieuThuChiDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.phieuThuChiService.create(dto, user.id);
    }

    // ============================================================
    // GET /cashflow - Danh sách phiếu (phân trang + filter)
    // ============================================================
    @Get()
    @ApiOperation({
        summary: 'Danh sách phiếu thu/chi',
        description: `
Lấy danh sách phiếu thu/chi với các tính năng:
- **Phân trang**: page, limit
- **Tìm kiếm**: theo mã phiếu, lý do
- **Lọc đa dạng**:
  - Theo loại: \`loai_phieu\` (thu/chi)
  - Theo thời gian: \`tu_ngay\` - \`den_ngay\`
  - Theo đối tượng: \`id_khach_hang\`, \`id_cong_viec\`
  - Theo danh mục: \`danh_muc\`
  - Theo phương thức: \`phuong_thuc\`

Response bao gồm thông tin người tạo, khách hàng và công việc liên quan.
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách phiếu thu/chi',
        type: PhieuThuChiListResponseDto,
    })
    async findAll(@Query() query: QueryPhieuThuChiDto) {
        return this.phieuThuChiService.findAll(query);
    }

    // ============================================================
    // GET /cashflow/stats - Thống kê dòng tiền (Dashboard)
    // ============================================================
    @Get('stats')
    @ApiOperation({
        summary: 'Thống kê dòng tiền (Dashboard)',
        description: `
Báo cáo tài chính nhanh cho Dashboard.

**Input:** Khoảng thời gian (mặc định: từ đầu tháng đến hôm nay)

**Output:**
- \`tong_thu\`: Tổng số tiền thu được
- \`tong_chi\`: Tổng số tiền chi ra
- \`ton_quy\`: Tồn quỹ = Thu - Chi
- \`so_phieu_thu\`: Số lượng phiếu thu
- \`so_phieu_chi\`: Số lượng phiếu chi

⚡ **Tối ưu:** Sử dụng aggregate của Database, không fetch all rồi tính bằng JS.
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Thống kê dòng tiền',
        type: CashFlowStatsResponseDto,
    })
    async getStats(@Query() query: CashFlowStatsQueryDto) {
        return this.phieuThuChiService.getStats(query);
    }

    // ============================================================
    // GET /cashflow/stats/category - Thống kê theo danh mục
    // ============================================================
    @Get('stats/category')
    @ApiOperation({
        summary: 'Thống kê theo danh mục',
        description: `
Phân tích cơ cấu thu/chi theo danh mục.

Giúp quản lý hiểu:
- Nguồn thu chính đến từ đâu?
- Chi phí nào chiếm tỷ trọng cao nhất?
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    loai_phieu: { type: 'string', example: 'thu' },
                    danh_muc: { type: 'string', example: 'Thanh toán hợp đồng' },
                    tong_tien: { type: 'number', example: 50000000 },
                    so_phieu: { type: 'number', example: 10 },
                },
            },
        },
    })
    async getStatsByCategory(@Query() query: CashFlowStatsQueryDto) {
        return this.phieuThuChiService.getStatsByCategory(query);
    }

    // ============================================================
    // GET /cashflow/count - Đếm tổng số phiếu
    // ============================================================
    @Get('count')
    @ApiOperation({ summary: 'Đếm tổng số phiếu thu/chi' })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: {
                count: { type: 'number', example: 150 },
            },
        },
    })
    async count() {
        const count = await this.phieuThuChiService.count();
        return { count };
    }

    // ============================================================
    // GET /cashflow/:id - Chi tiết phiếu
    // ============================================================
    @Get(':id')
    @ApiOperation({
        summary: 'Chi tiết phiếu thu/chi',
        description: 'Lấy thông tin chi tiết phiếu kèm thông tin người tạo, khách hàng và công việc',
    })
    @ApiParam({ name: 'id', description: 'UUID của phiếu thu/chi' })
    @ApiResponse({ status: HttpStatus.OK, type: PhieuThuChiResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy phiếu' })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.phieuThuChiService.findOne(id);
    }

    // ============================================================
    // PATCH /cashflow/:id - Cập nhật phiếu
    // ============================================================
    @Patch(':id')
    @ApiOperation({
        summary: 'Cập nhật phiếu thu/chi',
        description: `
Cập nhật thông tin phiếu thu/chi.

**Các field có thể cập nhật:**
- \`so_tien\` (phải > 0)
- \`phuong_thuc\`
- \`ly_do\`
- \`danh_muc\`
- \`anh_chung_tu\`
- \`ghi_chu\`

**Lưu ý:** Không thể thay đổi \`loai_phieu\` và \`ma_phieu\` sau khi tạo.
        `,
    })
    @ApiParam({ name: 'id', description: 'UUID của phiếu thu/chi' })
    @ApiBody({ type: UpdatePhieuThuChiDto })
    @ApiResponse({ status: HttpStatus.OK, type: PhieuThuChiResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy phiếu' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Số tiền <= 0' })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdatePhieuThuChiDto,
    ) {
        return this.phieuThuChiService.update(id, dto);
    }

    // ============================================================
    // DELETE /cashflow/:id - Xóa phiếu (soft delete)
    // ============================================================
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa phiếu thu/chi (soft delete)',
        description: `
Xóa mềm phiếu thu/chi. Phiếu vẫn tồn tại trong database với \`ngay_xoa\` được set.

Có thể khôi phục bằng API restore nếu cần.
        `,
    })
    @ApiParam({ name: 'id', description: 'UUID của phiếu thu/chi' })
    @ApiResponse({ status: HttpStatus.OK, type: PhieuThuChiResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy phiếu' })
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.phieuThuChiService.remove(id);
    }

    // ============================================================
    // PATCH /cashflow/:id/restore - Khôi phục phiếu đã xóa
    // ============================================================
    @Patch(':id/restore')
    @ApiOperation({
        summary: 'Khôi phục phiếu đã xóa',
        description: 'Khôi phục phiếu thu/chi đã bị soft delete',
    })
    @ApiParam({ name: 'id', description: 'UUID của phiếu thu/chi đã xóa' })
    @ApiResponse({ status: HttpStatus.OK, type: PhieuThuChiResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy phiếu đã xóa' })
    async restore(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.phieuThuChiService.restore(id);
    }
}
