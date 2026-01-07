/**
 * ============================================================
 * BÁO GIÁ CONTROLLER - QuoteMaster Module
 * ServiceOS - SaaS Backend
 * ============================================================
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
import { BaoGiaService } from '../services/bao-gia.service';
import { JwtAuthGuard } from '@libs/common';
import {
    CreateBaoGiaDto,
    QueryBaoGiaDto,
    UpdateBaoGiaStatusDto,
    BaoGiaResponseDto,
    BaoGiaListResponseDto,
    TrangThaiBaoGia,
} from '../dto/bao-gia.dto';

@ApiTags('QuoteMaster - Báo Giá')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(BaoGiaResponseDto, BaoGiaListResponseDto)
@Controller('bao-gia')
export class BaoGiaController {
    constructor(private readonly baoGiaService: BaoGiaService) { }

    /**
     * POST /bao-gia - Tạo báo giá mới
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Tạo báo giá mới',
        description: `
Tạo báo giá mới cho khách hàng.

**Tính năng tự động:**
- \`ma_bao_gia\` tự động generate (Format: BG-{Timestamp})
- Lấy \`don_gia\` từ bảng SanPham tại thời điểm tạo (snapshot giá)
- Tự động tính: \`thanh_tien\`, \`tong_tien_truoc_thue\`, \`tien_thue\`, \`tong_tien_sau_thue\`

**Validation:**
- Danh sách \`items\` phải có ít nhất 1 sản phẩm
- Tất cả \`id_san_pham\` phải tồn tại trong hệ thống
- \`id_khach_hang\` phải tồn tại

**Công thức tính tiền:**
- thanh_tien = so_luong × don_gia
- tong_tien_truoc_thue = ∑(thanh_tien)
- tien_thue = tong_tien_truoc_thue × thue_vat ÷ 100
- tong_tien_sau_thue = tong_tien_truoc_thue + tien_thue
        `,
    })
    @ApiBody({ type: CreateBaoGiaDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Báo giá được tạo thành công',
        type: BaoGiaResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu không hợp lệ / Danh sách items rỗng' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Khách hàng hoặc sản phẩm không tồn tại' })
    async create(@Body() dto: CreateBaoGiaDto) {
        return this.baoGiaService.create(dto);
    }

    /**
     * GET /bao-gia - Danh sách báo giá (phân trang + filter)
     */
    @Get()
    @ApiOperation({
        summary: 'Danh sách báo giá',
        description: `
Lấy danh sách báo giá với các tính năng:
- **Phân trang**: page, limit
- **Tìm kiếm**: theo mã báo giá, tiêu đề
- **Lọc**: theo trạng thái, khách hàng, khoảng thời gian

Response bao gồm thông tin khách hàng và chi tiết các sản phẩm.
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách báo giá',
        type: BaoGiaListResponseDto,
    })
    async findAll(@Query() query: QueryBaoGiaDto) {
        return this.baoGiaService.findAll(query);
    }

    /**
     * GET /bao-gia/stats - Thống kê theo trạng thái
     */
    @Get('stats')
    @ApiOperation({
        summary: 'Thống kê báo giá theo trạng thái',
        description: 'Trả về số lượng và tổng tiền báo giá theo từng trạng thái',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    trang_thai: { type: 'string', example: 'DRAFT' },
                    count: { type: 'number', example: 10 },
                    tong_tien: { type: 'number', example: 50000000 },
                },
            },
        },
    })
    async getStats() {
        return this.baoGiaService.getStatsByTrangThai();
    }

    /**
     * GET /bao-gia/count - Đếm tổng số
     */
    @Get('count')
    @ApiOperation({ summary: 'Đếm tổng số báo giá' })
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
        const count = await this.baoGiaService.count();
        return { count };
    }

    /**
     * GET /bao-gia/:id - Chi tiết báo giá
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Chi tiết báo giá',
        description: 'Lấy thông tin chi tiết báo giá kèm thông tin khách hàng và danh sách sản phẩm',
    })
    @ApiParam({ name: 'id', description: 'UUID của báo giá' })
    @ApiResponse({ status: HttpStatus.OK, type: BaoGiaResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy báo giá' })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.baoGiaService.findOne(id);
    }

    /**
     * PATCH /bao-gia/:id/status - Cập nhật trạng thái
     */
    @Patch(':id/status')
    @ApiOperation({
        summary: 'Cập nhật trạng thái báo giá',
        description: `
Cập nhật trạng thái báo giá.

**Các chuyển đổi trạng thái hợp lệ:**
- DRAFT → SENT (Gửi cho khách hàng)
- DRAFT → EXPIRED (Hủy/hết hạn)
- SENT → ACCEPTED (Khách chấp nhận)
- SENT → REJECTED (Khách từ chối)
- SENT → EXPIRED (Hết hạn)

**Trạng thái cuối (không thể thay đổi):**
- ACCEPTED, REJECTED, EXPIRED
        `,
    })
    @ApiParam({ name: 'id', description: 'UUID của báo giá' })
    @ApiBody({ type: UpdateBaoGiaStatusDto })
    @ApiResponse({ status: HttpStatus.OK, type: BaoGiaResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy báo giá' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Chuyển đổi trạng thái không hợp lệ' })
    async updateStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateBaoGiaStatusDto,
    ) {
        return this.baoGiaService.updateStatus(id, dto);
    }

    /**
     * DELETE /bao-gia/:id - Xóa báo giá (soft delete)
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa báo giá (soft delete)',
        description: 'Xóa mềm báo giá. **Chỉ được xóa báo giá ở trạng thái DRAFT**',
    })
    @ApiParam({ name: 'id', description: 'UUID của báo giá' })
    @ApiResponse({ status: HttpStatus.OK, type: BaoGiaResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy báo giá' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Chỉ có thể xóa báo giá DRAFT' })
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.baoGiaService.remove(id);
    }
}
