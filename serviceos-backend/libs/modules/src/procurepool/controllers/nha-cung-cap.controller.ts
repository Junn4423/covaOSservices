/**
 * ============================================================
 * NHÀ CUNG CẤP CONTROLLER - ProcurePool Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * REST API for Supplier Management (NhaCungCap)
 * Phase 10: ProcurePool - Procurement Management
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
    UseGuards,
    ParseUUIDPipe,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import { NhaCungCapService } from '../services/nha-cung-cap.service';
import {
    CreateNhaCungCapDto,
    UpdateNhaCungCapDto,
    QueryNhaCungCapDto,
    NhaCungCapResponseDto,
    NhaCungCapListResponseDto,
} from '../dto/nha-cung-cap.dto';

@ApiTags('ProcurePool - Nhà cung cấp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nha-cung-cap')
export class NhaCungCapController {
    constructor(private readonly nhaCungCapService: NhaCungCapService) { }

    // ============================================================
    // CREATE
    // ============================================================

    @Post()
    @ApiOperation({
        summary: 'Tạo nhà cung cấp mới',
        description: 'Tạo một nhà cung cấp mới trong hệ thống',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Tạo nhà cung cấp thành công',
        type: NhaCungCapResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Mã NCC đã tồn tại hoặc dữ liệu không hợp lệ',
    })
    async create(
        @ActiveUser() user: ActiveUserData,
        @Body() dto: CreateNhaCungCapDto,
    ) {
        return this.nhaCungCapService.create(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // READ
    // ============================================================

    @Get()
    @ApiOperation({
        summary: 'Danh sách nhà cung cấp',
        description: 'Lấy danh sách nhà cung cấp với phân trang và tìm kiếm',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lấy danh sách thành công',
        type: NhaCungCapListResponseDto,
    })
    async findAll(
        @ActiveUser() user: ActiveUserData,
        @Query() query: QueryNhaCungCapDto,
    ) {
        return this.nhaCungCapService.findAll(user.id_doanh_nghiep, query);
    }

    @Get('active')
    @ApiOperation({
        summary: 'Danh sách NCC đang hoạt động (cho dropdown)',
        description: 'Lấy tất cả NCC đang hoạt động, không phân trang',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lấy danh sách thành công',
    })
    async getAllActive(@ActiveUser() user: ActiveUserData) {
        return this.nhaCungCapService.getAllActive(user.id_doanh_nghiep);
    }

    @Get('count')
    @ApiOperation({
        summary: 'Thống kê số lượng NCC',
        description: 'Đếm số lượng NCC theo trạng thái',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Thống kê thành công',
    })
    async count(@ActiveUser() user: ActiveUserData) {
        return this.nhaCungCapService.count(user.id_doanh_nghiep);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Chi tiết nhà cung cấp',
        description: 'Lấy thông tin chi tiết của một nhà cung cấp theo ID',
    })
    @ApiParam({ name: 'id', description: 'ID nhà cung cấp (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lấy thông tin thành công',
        type: NhaCungCapResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy nhà cung cấp',
    })
    async findOne(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.nhaCungCapService.findOne(user.id_doanh_nghiep, id);
    }

    // ============================================================
    // UPDATE
    // ============================================================

    @Put(':id')
    @ApiOperation({
        summary: 'Cập nhật nhà cung cấp',
        description: 'Cập nhật thông tin nhà cung cấp theo ID',
    })
    @ApiParam({ name: 'id', description: 'ID nhà cung cấp (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Cập nhật thành công',
        type: NhaCungCapResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy nhà cung cấp',
    })
    async update(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateNhaCungCapDto,
    ) {
        return this.nhaCungCapService.update(
            user.id_doanh_nghiep,
            id,
            dto,
            user.id,
        );
    }

    // ============================================================
    // DELETE (SOFT)
    // ============================================================

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Xóa nhà cung cấp (soft delete)',
        description: 'Đánh dấu xóa mềm nhà cung cấp',
    })
    @ApiParam({ name: 'id', description: 'ID nhà cung cấp (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Xóa thành công',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy nhà cung cấp',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Không thể xóa NCC có đơn hàng đang xử lý',
    })
    async remove(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.nhaCungCapService.remove(user.id_doanh_nghiep, id, user.id);
    }

    @Patch(':id/restore')
    @ApiOperation({
        summary: 'Khôi phục nhà cung cấp đã xóa',
        description: 'Khôi phục nhà cung cấp đã bị xóa mềm',
    })
    @ApiParam({ name: 'id', description: 'ID nhà cung cấp (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Khôi phục thành công',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy nhà cung cấp đã xóa',
    })
    async restore(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.nhaCungCapService.restore(user.id_doanh_nghiep, id, user.id);
    }
}
