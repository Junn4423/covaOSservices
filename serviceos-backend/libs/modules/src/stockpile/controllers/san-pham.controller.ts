/**
 * ============================================================
 * SẢN PHẨM CONTROLLER - StockPile Module
 * ServiceOS - SaaS Backend
 * ============================================================
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
import { SanPhamService } from '../services/san-pham.service';
import { JwtAuthGuard } from '@libs/common';
import {
    CreateSanPhamDto,
    UpdateSanPhamDto,
    QuerySanPhamDto,
    SanPhamResponseDto,
    SanPhamListResponseDto,
} from '../dto/san-pham.dto';

@ApiTags('StockPile - Sản Phẩm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(SanPhamResponseDto, SanPhamListResponseDto)
@Controller('san-pham')
export class SanPhamController {
    constructor(private readonly sanPhamService: SanPhamService) { }

    /**
     * POST /san-pham - Tạo sản phẩm mới
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Tạo sản phẩm mới',
        description: `
Tạo sản phẩm mới trong hệ thống.

**Lưu ý:**
- \`ma_san_pham\` tự động generate nếu không gửi (Format: SP-{Timestamp})
- \`gia_ban\` và \`gia_von\` phải >= 0
- \`id_nhom_san_pham\` là optional, có thể gán sau
        `,
    })
    @ApiBody({ type: CreateSanPhamDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Sản phẩm được tạo thành công',
        type: SanPhamResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Mã sản phẩm đã tồn tại' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Nhóm sản phẩm không tồn tại' })
    async create(@Body() dto: CreateSanPhamDto) {
        return this.sanPhamService.create(dto);
    }

    /**
     * GET /san-pham - Danh sách sản phẩm (phân trang + filter)
     */
    @Get()
    @ApiOperation({
        summary: 'Danh sách sản phẩm',
        description: `
Lấy danh sách sản phẩm với các tính năng:
- **Phân trang**: page, limit
- **Tìm kiếm**: theo tên, mã SP
- **Lọc**: theo nhóm sản phẩm, loại sản phẩm

Response bao gồm thông tin nhóm sản phẩm (nếu có).
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách sản phẩm',
        type: SanPhamListResponseDto,
    })
    async findAll(@Query() query: QuerySanPhamDto) {
        return this.sanPhamService.findAll(query);
    }

    /**
     * GET /san-pham/stats/loai - Thống kê theo loại SP
     */
    @Get('stats/loai')
    @ApiOperation({ summary: 'Thống kê theo loại sản phẩm' })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    loai_san_pham: { type: 'string', example: 'HANG_HOA' },
                    count: { type: 'number', example: 50 },
                },
            },
        },
    })
    async getStatsByLoai() {
        return this.sanPhamService.getStatsByLoaiSanPham();
    }

    /**
     * GET /san-pham/stats/nhom - Thống kê theo nhóm SP
     */
    @Get('stats/nhom')
    @ApiOperation({ summary: 'Thống kê theo nhóm sản phẩm' })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id_nhom_san_pham: { type: 'string' },
                    ten_nhom: { type: 'string', example: 'Dịch vụ máy lạnh' },
                    count: { type: 'number', example: 25 },
                },
            },
        },
    })
    async getStatsByNhom() {
        return this.sanPhamService.getStatsByNhomSanPham();
    }

    /**
     * GET /san-pham/count - Đếm tổng số
     */
    @Get('count')
    @ApiOperation({ summary: 'Đếm tổng số sản phẩm' })
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
        const count = await this.sanPhamService.count();
        return { count };
    }

    /**
     * GET /san-pham/:id - Chi tiết sản phẩm
     */
    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết sản phẩm' })
    @ApiParam({ name: 'id', description: 'UUID của sản phẩm' })
    @ApiResponse({ status: HttpStatus.OK, type: SanPhamResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy' })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.sanPhamService.findOne(id);
    }

    /**
     * PUT /san-pham/:id - Cập nhật sản phẩm
     */
    @Put(':id')
    @ApiOperation({ summary: 'Cập nhật thông tin sản phẩm' })
    @ApiParam({ name: 'id', description: 'UUID của sản phẩm' })
    @ApiBody({ type: UpdateSanPhamDto })
    @ApiResponse({ status: HttpStatus.OK, type: SanPhamResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Mã SP đã tồn tại' })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateSanPhamDto,
    ) {
        return this.sanPhamService.update(id, dto);
    }

    /**
     * PATCH /san-pham/:id - Cập nhật một phần
     */
    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật một phần thông tin sản phẩm' })
    @ApiParam({ name: 'id' })
    @ApiBody({ type: UpdateSanPhamDto })
    @ApiResponse({ status: HttpStatus.OK, type: SanPhamResponseDto })
    async partialUpdate(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateSanPhamDto,
    ) {
        return this.sanPhamService.update(id, dto);
    }

    /**
     * DELETE /san-pham/:id - Xóa sản phẩm (soft delete)
     */
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa sản phẩm (soft delete)',
        description: 'Xóa mềm sản phẩm - không xóa thật sự, chỉ set ngay_xoa',
    })
    @ApiParam({ name: 'id', description: 'UUID của sản phẩm' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.sanPhamService.remove(id);
    }
}
