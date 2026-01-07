/**
 * ============================================================
 * HỢP ĐỒNG CONTROLLER - QuoteMaster Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * 📌 PHASE 6: Contract Management
 *
 * Endpoints:
 * - POST   /hop-dong              -> Tạo hợp đồng thủ công
 * - POST   /hop-dong/from-quote/:quoteId ->  Convert báo giá thành hợp đồng
 * - GET    /hop-dong              -> Danh sách + filter + pagination
 * - GET    /hop-dong/expiring     -> Danh sách sắp hết hạn (Dashboard)
 * - GET    /hop-dong/stats        -> Thống kê hợp đồng
 * - GET    /hop-dong/:id          -> Chi tiết hợp đồng
 * - PATCH  /hop-dong/:id          -> Cập nhật thông tin
 * - PATCH  /hop-dong/:id/status   -> Cập nhật trạng thái
 * - DELETE /hop-dong/:id          -> Soft delete
 */

import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    ParseIntPipe,
    DefaultValuePipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { HopDongService } from '../services/hop-dong.service';
import {
    CreateHopDongDto,
    CreateHopDongFromQuoteDto,
    UpdateHopDongDto,
    UpdateHopDongStatusDto,
    QueryHopDongDto,
    HopDongResponseDto,
    HopDongListResponseDto,
    HopDongExpiringResponseDto,
    TrangThaiHopDong,
} from '../dto/hop-dong.dto';

@ApiTags('QuoteMaster - Hợp Đồng')
@ApiBearerAuth()
@Controller('hop-dong')
export class HopDongController {
    constructor(private readonly hopDongService: HopDongService) { }

    // ============================================================
    // CREATE - Tạo hợp đồng thủ công
    // ============================================================

    /**
     * Tạo hợp đồng mới (thủ công)
     *
     * Dùng khi cần tạo hợp đồng không từ báo giá
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Tạo hợp đồng mới (thủ công)',
        description: `
Tạo một hợp đồng mới không liên kết với báo giá.

**Trường hợp sử dụng:**
- Hợp đồng được ký trực tiếp mà không qua báo giá
- Import hợp đồng cũ vào hệ thống
        `,
    })
    @ApiResponse({
        status: 201,
        description: 'Tạo hợp đồng thành công',
        type: HopDongResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy khách hàng' })
    async create(@Body() dto: CreateHopDongDto) {
        return this.hopDongService.create(dto);
    }

    // ============================================================
    // CREATE FROM QUOTE -  Core Feature
    // ============================================================

    /**
     * Convert báo giá thành hợp đồng
     *
     *  Đây là API quan trọng nhất của Phase 6!
     *
     * Flow trong thực tế:
     * 1. Sales tạo báo giá, gửi cho khách
     * 2. Khách đồng ý -> Cập nhật trạng thái ACCEPTED
     * 3. Gọi API này để chuyển thành hợp đồng
     */
    @Post('from-quote/:quoteId')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: ' Convert báo giá thành hợp đồng',
        description: `
**Tính năng CORE của Contract Management!**

Chuyển đổi một báo giá đã được khách hàng chấp nhận thành hợp đồng.

**Điều kiện:**
- Báo giá phải có trạng thái \`ACCEPTED\` hoặc \`SENT\`
- Báo giá chưa được chuyển đổi thành hợp đồng nào khác

**Dữ liệu được copy:**
- \`id_khach_hang\`: Từ báo giá
- \`gia_tri_hop_dong\`: = \`tong_tien_sau_thue\` của báo giá
- \`ngay_ky\`: Mặc định là ngày hiện tại

**Cách gọi API trong Swagger:**
1. Expand endpoint này
2. Nhập \`quoteId\` (UUID của báo giá)
3. Có thể để trống body hoặc thêm thông tin bổ sung
4. Click "Execute"
        `,
    })
    @ApiParam({
        name: 'quoteId',
        description: 'ID báo giá cần chuyển đổi (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 201,
        description: 'Chuyển đổi thành công, trả về hợp đồng mới và thông tin báo giá gốc',
    })
    @ApiResponse({ status: 400, description: 'Báo giá không ở trạng thái phù hợp để chuyển đổi' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy báo giá' })
    @ApiResponse({ status: 409, description: 'Báo giá đã được chuyển đổi trước đó' })
    async createFromQuote(
        @Param('quoteId', ParseUUIDPipe) quoteId: string,
        @Body() dto?: CreateHopDongFromQuoteDto,
    ) {
        return this.hopDongService.createFromQuote(quoteId, dto);
    }

    // ============================================================
    // FIND ALL - Danh sách + Filter
    // ============================================================

    /**
     * Lấy danh sách hợp đồng
     */
    @Get()
    @ApiOperation({
        summary: 'Danh sách hợp đồng',
        description: `
Lấy danh sách hợp đồng với các bộ lọc.

**Filters:**
- \`trang_thai\`: 0 (DRAFT), 1 (ACTIVE), 2 (EXPIRED), 3 (LIQUIDATED), 4 (CANCELLED)
- \`id_khach_hang\`: Lọc theo khách hàng
- \`sap_het_han\`: true = Lấy các hợp đồng sắp hết hạn trong 30 ngày
- \`search\`: Tìm theo mã hoặc tên hợp đồng
        `,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách hợp đồng',
        type: HopDongListResponseDto,
    })
    async findAll(@Query() query: QueryHopDongDto) {
        return this.hopDongService.findAll(query);
    }

    // ============================================================
    // FIND EXPIRING - Danh sách sắp hết hạn
    // ============================================================

    /**
     * Lấy danh sách hợp đồng sắp hết hạn
     *
     * Dùng cho Dashboard để hiển thị cảnh báo
     */
    @Get('expiring')
    @ApiOperation({
        summary: 'Danh sách hợp đồng sắp hết hạn',
        description: `
Lấy danh sách các hợp đồng ACTIVE sắp hết hạn.

**Mặc định:** 30 ngày tới

Sử dụng cho Dashboard để hiển thị cảnh báo.
        `,
    })
    @ApiQuery({
        name: 'days',
        required: false,
        description: 'Số ngày cảnh báo trước (mặc định: 30)',
        example: 30,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách hợp đồng sắp hết hạn',
        type: HopDongExpiringResponseDto,
    })
    async findExpiring(
        @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    ) {
        return this.hopDongService.findExpiring(days);
    }

    // ============================================================
    // STATS - Thống kê
    // ============================================================

    /**
     * Thống kê hợp đồng
     */
    @Get('stats')
    @ApiOperation({
        summary: 'Thống kê hợp đồng',
        description: `
Lấy thống kê hợp đồng:
- Số lượng theo trạng thái
- Tổng giá trị hợp đồng đang hiệu lực
- Số hợp đồng sắp hết hạn
        `,
    })
    @ApiResponse({
        status: 200,
        description: 'Thống kê hợp đồng',
    })
    async getStats() {
        return this.hopDongService.getStats();
    }

    // ============================================================
    // FIND ONE - Chi tiết
    // ============================================================

    /**
     * Lấy chi tiết một hợp đồng
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Chi tiết hợp đồng',
        description: 'Lấy thông tin chi tiết của một hợp đồng theo ID',
    })
    @ApiParam({
        name: 'id',
        description: 'ID hợp đồng (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: 200,
        description: 'Thông tin hợp đồng',
        type: HopDongResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.hopDongService.findOne(id);
    }

    // ============================================================
    // UPDATE - Cập nhật thông tin
    // ============================================================

    /**
     * Cập nhật thông tin hợp đồng
     *
     * Cho phép cập nhật:
     * - Tên hợp đồng
     * - Ngày hết hạn
     * - File PDF URL
     * - Chữ ký số URL
     * - Ghi chú
     */
    @Patch(':id')
    @ApiOperation({
        summary: 'Cập nhật hợp đồng',
        description: `
Cập nhật thông tin hợp đồng.

**Có thể cập nhật:**
- \`ten_hop_dong\`: Tên hợp đồng
- \`ngay_het_han\`: Ngày hết hạn mới
- \`file_pdf_url\`: Link file PDF đã ký
- \`chu_ky_so_url\`: Link chữ ký số
- \`ghi_chu\`: Ghi chú

**Lưu ý:** Giá trị hợp đồng không thể thay đổi sau khi tạo.
        `,
    })
    @ApiParam({
        name: 'id',
        description: 'ID hợp đồng (UUID)',
    })
    @ApiResponse({
        status: 200,
        description: 'Cập nhật thành công',
        type: HopDongResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateHopDongDto,
    ) {
        return this.hopDongService.update(id, dto);
    }

    // ============================================================
    // UPDATE STATUS - Cập nhật trạng thái
    // ============================================================

    /**
     * Cập nhật trạng thái hợp đồng
     */
    @Patch(':id/status')
    @ApiOperation({
        summary: 'Cập nhật trạng thái hợp đồng',
        description: `
Thay đổi trạng thái hợp đồng.

**Các trạng thái:**
- \`0\` - DRAFT: Nháp
- \`1\` - ACTIVE: Đang hiệu lực
- \`2\` - EXPIRED: Đã hết hạn
- \`3\` - LIQUIDATED: Đã thanh lý
- \`4\` - CANCELLED: Đã hủy

**Quy tắc chuyển đổi:**
- DRAFT -> ACTIVE (Kích hoạt)
- ACTIVE -> LIQUIDATED (Thanh lý)
- ACTIVE -> EXPIRED (Hết hạn)
- Không thể chuyển về DRAFT
- Không thể thay đổi hợp đồng đã LIQUIDATED hoặc CANCELLED
        `,
    })
    @ApiParam({
        name: 'id',
        description: 'ID hợp đồng (UUID)',
    })
    @ApiResponse({
        status: 200,
        description: 'Cập nhật trạng thái thành công',
        type: HopDongResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Không thể chuyển đổi trạng thái' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateHopDongStatusDto,
    ) {
        return this.hopDongService.updateStatus(id, dto);
    }

    // ============================================================
    // DELETE - Xóa mềm
    // ============================================================

    /**
     * Xóa hợp đồng (soft delete)
     *
     * Chỉ cho phép xóa hợp đồng ở trạng thái DRAFT
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa hợp đồng',
        description: `
Xóa mềm hợp đồng.

**Điều kiện:** Chỉ có thể xóa hợp đồng ở trạng thái DRAFT.

Hợp đồng đã ACTIVE hoặc các trạng thái khác không thể xóa.
        `,
    })
    @ApiParam({
        name: 'id',
        description: 'ID hợp đồng (UUID)',
    })
    @ApiResponse({
        status: 200,
        description: 'Xóa thành công',
    })
    @ApiResponse({ status: 400, description: 'Không thể xóa hợp đồng không ở trạng thái DRAFT' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.hopDongService.remove(id);
    }
}
