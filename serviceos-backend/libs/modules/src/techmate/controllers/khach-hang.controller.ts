/**
 * ============================================================
 * KHÁCH HÀNG CONTROLLER - TechMate CRM Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * REST API endpoints cho quản lý khách hàng.
 * Tất cả endpoints đều được bảo vệ bởi JWT Authentication.
 *
 * Base URL: /api/v1/khach-hang
 */

import {
    Controller,
    Get,
    Post,
    Put,
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
import { KhachHangService } from '../services/khach-hang.service';
import { JwtAuthGuard } from '@libs/common';
import {
    CreateKhachHangDto,
    UpdateKhachHangDto,
    QueryKhachHangDto,
    KhachHangResponseDto,
    KhachHangListResponseDto,
} from '../dto/khach-hang.dto';

@ApiTags('TechMate - Khách Hàng')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(KhachHangResponseDto, KhachHangListResponseDto)
@Controller('khach-hang')
export class KhachHangController {
    constructor(private readonly khachHangService: KhachHangService) { }

    /**
     * ============================================================
     * POST /khach-hang - Tạo khách hàng mới
     * ============================================================
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Tạo khách hàng mới',
        description: `
Tạo một khách hàng mới trong hệ thống.

**Lưu ý:**
- \`ma_khach_hang\` tự động generate nếu không gửi (Format: KH-{Timestamp})
- \`id_doanh_nghiep\` tự động gán từ token JWT
- \`nguoi_tao_id\` tự động gán từ user hiện tại
        `,
    })
    @ApiBody({ type: CreateKhachHangDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Khách hàng được tạo thành công',
        type: KhachHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Dữ liệu không hợp lệ (validation failed)',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Mã khách hàng đã tồn tại trong doanh nghiệp',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Chưa đăng nhập hoặc token không hợp lệ',
    })
    async create(@Body() createDto: CreateKhachHangDto) {
        return this.khachHangService.create(createDto);
    }

    /**
     * ============================================================
     * GET /khach-hang - Danh sách khách hàng (có phân trang)
     * ============================================================
     */
    @Get()
    @ApiOperation({
        summary: 'Danh sách khách hàng',
        description: `
Lấy danh sách khách hàng với các tính năng:
- **Phân trang**: page, limit
- **Tìm kiếm**: theo tên, SĐT, email, mã KH
- **Lọc**: theo nguồn khách, loại khách

**Tự động**: Filter theo doanh nghiệp của user, exclude records đã xóa mềm.
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách khách hàng',
        type: KhachHangListResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Chưa đăng nhập hoặc token không hợp lệ',
    })
    async findAll(@Query() query: QueryKhachHangDto) {
        return this.khachHangService.findAll(query);
    }

    /**
     * ============================================================
     * GET /khach-hang/stats - Thống kê khách hàng
     * ============================================================
     */
    @Get('stats')
    @ApiOperation({
        summary: 'Thống kê khách hàng theo nguồn',
        description: 'Lấy số lượng khách hàng theo từng nguồn (FACEBOOK, WEBSITE, REFERRAL, KHAC)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Thống kê thành công',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    nguon_khach: { type: 'string', example: 'FACEBOOK' },
                    count: { type: 'number', example: 45 },
                },
            },
        },
    })
    async getStats() {
        return this.khachHangService.getStatsByNguonKhach();
    }

    /**
     * ============================================================
     * GET /khach-hang/count - Đếm tổng số khách hàng
     * ============================================================
     */
    @Get('count')
    @ApiOperation({
        summary: 'Đếm tổng số khách hàng',
        description: 'Trả về tổng số khách hàng của doanh nghiệp (dùng cho dashboard)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Số lượng khách hàng',
        schema: {
            type: 'object',
            properties: {
                count: { type: 'number', example: 150 },
            },
        },
    })
    async count() {
        const count = await this.khachHangService.count();
        return { count };
    }

    /**
     * ============================================================
     * GET /khach-hang/:id - Chi tiết khách hàng
     * ============================================================
     */
    @Get(':id')
    @ApiOperation({
        summary: 'Chi tiết khách hàng',
        description: 'Lấy thông tin chi tiết của một khách hàng theo ID',
    })
    @ApiParam({
        name: 'id',
        description: 'UUID của khách hàng',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Chi tiết khách hàng',
        type: KhachHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy khách hàng',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Chưa đăng nhập hoặc token không hợp lệ',
    })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.khachHangService.findOne(id);
    }

    /**
     * ============================================================
     * PUT /khach-hang/:id - Cập nhật khách hàng
     * ============================================================
     */
    @Put(':id')
    @ApiOperation({
        summary: 'Cập nhật thông tin khách hàng',
        description: `
Cập nhật thông tin khách hàng. Chỉ gửi các fields cần update.

**Lưu ý:**
- \`nguoi_cap_nhat_id\` tự động gán từ user hiện tại
- Nếu update \`ma_khach_hang\`, sẽ kiểm tra trùng trong doanh nghiệp
        `,
    })
    @ApiParam({
        name: 'id',
        description: 'UUID của khách hàng',
    })
    @ApiBody({ type: UpdateKhachHangDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Khách hàng được cập nhật thành công',
        type: KhachHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy khách hàng',
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Mã khách hàng đã được sử dụng',
    })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateDto: UpdateKhachHangDto,
    ) {
        return this.khachHangService.update(id, updateDto);
    }

    /**
     * ============================================================
     * PATCH /khach-hang/:id - Cập nhật một phần (alias của PUT)
     * ============================================================
     */
    @Patch(':id')
    @ApiOperation({
        summary: 'Cập nhật một phần thông tin khách hàng',
        description: 'Tương tự PUT, dùng PATCH cho cập nhật một phần dữ liệu',
    })
    @ApiParam({ name: 'id', description: 'UUID của khách hàng' })
    @ApiBody({ type: UpdateKhachHangDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Cập nhật thành công',
        type: KhachHangResponseDto,
    })
    async partialUpdate(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateDto: UpdateKhachHangDto,
    ) {
        return this.khachHangService.update(id, updateDto);
    }

    /**
     * ============================================================
     * DELETE /khach-hang/:id - Xóa mềm khách hàng
     * ============================================================
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa khách hàng (soft delete)',
        description: `
Xóa mềm khách hàng - không xóa thật sự mà chỉ set \`ngay_xoa\`.

Có thể khôi phục bằng endpoint PATCH /khach-hang/:id/restore
        `,
    })
    @ApiParam({
        name: 'id',
        description: 'UUID của khách hàng cần xóa',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Khách hàng đã được xóa (soft delete)',
        type: KhachHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy khách hàng',
    })
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.khachHangService.remove(id);
    }

    /**
     * ============================================================
     * PATCH /khach-hang/:id/restore - Khôi phục khách hàng đã xóa
     * ============================================================
     */
    @Patch(':id/restore')
    @ApiOperation({
        summary: 'Khôi phục khách hàng đã xóa',
        description: 'Khôi phục khách hàng đã bị soft delete',
    })
    @ApiParam({
        name: 'id',
        description: 'UUID của khách hàng cần khôi phục',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Khách hàng đã được khôi phục',
        type: KhachHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy khách hàng đã xóa',
    })
    async restore(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.khachHangService.restore(id);
    }
}
