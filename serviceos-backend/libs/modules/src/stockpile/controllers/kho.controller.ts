/**
 * ============================================================
 * KHO CONTROLLER - StockPile Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  WAREHOUSE MANAGEMENT API:
 * - CRUD cơ bản cho kho
 * - Soft delete support
 * - Multi-tenant support
 *
 * Phase 9: StockPile Advanced - Warehouse & Inventory
 */

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Patch,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { KhoService } from '../services/kho.service';
import {
    CreateKhoDto,
    UpdateKhoDto,
    QueryKhoDto,
    KhoResponseDto,
    KhoListResponseDto,
} from '../dto/kho.dto';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';

@ApiTags('StockPile - Kho (Warehouse)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kho')
export class KhoController {
    constructor(private readonly khoService: KhoService) { }

    // ============================================================
    //  POST /kho - Tạo kho mới
    // ============================================================
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Tạo kho mới',
        description: 'Tạo kho mới với loại CO_DINH hoặc XE (kho di động)',
    })
    @ApiResponse({
        status: 201,
        description: 'Tạo kho thành công',
        type: KhoResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy người phụ trách' })
    async create(
        @Body() dto: CreateKhoDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.khoService.create(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    //  GET /kho - Danh sách kho
    // ============================================================
    @Get()
    @ApiOperation({
        summary: 'Lấy danh sách kho',
        description: 'Lấy danh sách kho với phân trang và bộ lọc',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách kho',
        type: KhoListResponseDto,
    })
    async findAll(
        @Query() query: QueryKhoDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.khoService.findAll(user.id_doanh_nghiep, query);
    }

    // ============================================================
    //  GET /kho/active - Tất cả kho đang hoạt động (dropdown)
    // ============================================================
    @Get('active')
    @ApiOperation({
        summary: 'Lấy tất cả kho đang hoạt động',
        description: 'Dùng cho dropdown select, không phân trang',
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách kho đang hoạt động',
    })
    async getAllActive(@ActiveUser() user: ActiveUserData) {
        return this.khoService.getAllActive(user.id_doanh_nghiep);
    }

    // ============================================================
    //  GET /kho/count - Đếm tổng số kho
    // ============================================================
    @Get('count')
    @ApiOperation({
        summary: 'Đếm tổng số kho',
        description: 'Trả về tổng số kho đang hoạt động (không bị xóa)',
    })
    @ApiResponse({
        status: 200,
        description: 'Số lượng kho',
        schema: { type: 'number', example: 5 },
    })
    async count(@ActiveUser() user: ActiveUserData) {
        return this.khoService.count(user.id_doanh_nghiep);
    }

    // ============================================================
    //  GET /kho/:id - Chi tiết kho
    // ============================================================
    @Get(':id')
    @ApiOperation({
        summary: 'Lấy chi tiết kho',
        description: 'Lấy thông tin chi tiết của một kho theo ID',
    })
    @ApiParam({ name: 'id', description: 'ID kho (UUID)' })
    @ApiResponse({
        status: 200,
        description: 'Chi tiết kho',
        type: KhoResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy kho' })
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.khoService.findOne(user.id_doanh_nghiep, id);
    }

    // ============================================================
    //  PUT /kho/:id - Cập nhật kho
    // ============================================================
    @Put(':id')
    @ApiOperation({
        summary: 'Cập nhật kho',
        description: 'Cập nhật thông tin kho theo ID',
    })
    @ApiParam({ name: 'id', description: 'ID kho (UUID)' })
    @ApiResponse({
        status: 200,
        description: 'Cập nhật thành công',
        type: KhoResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy kho' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateKhoDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.khoService.update(user.id_doanh_nghiep, id, dto, user.id);
    }

    // ============================================================
    //  DELETE /kho/:id - Xóa mềm kho
    // ============================================================
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa kho (soft delete)',
        description:
            'Xóa mềm kho. Không thể xóa nếu kho còn tồn kho sản phẩm.',
    })
    @ApiParam({ name: 'id', description: 'ID kho (UUID)' })
    @ApiResponse({
        status: 200,
        description: 'Xóa thành công',
        type: KhoResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Kho còn tồn kho sản phẩm' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy kho' })
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.khoService.remove(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    //  PATCH /kho/:id/restore - Khôi phục kho đã xóa
    // ============================================================
    @Patch(':id/restore')
    @ApiOperation({
        summary: 'Khôi phục kho đã xóa',
        description: 'Khôi phục một kho đã bị xóa mềm',
    })
    @ApiParam({ name: 'id', description: 'ID kho (UUID)' })
    @ApiResponse({
        status: 200,
        description: 'Khôi phục thành công',
        type: KhoResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy kho đã xóa' })
    async restore(
        @Param('id', ParseUUIDPipe) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.khoService.restore(user.id_doanh_nghiep, id, user.id);
    }
}
