/**
 * ============================================================
 * NHÓM SẢN PHẨM CONTROLLER - StockPile Module
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import {
    Controller,
    Get,
    Post,
    Put,
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
} from '@nestjs/swagger';
import { NhomSanPhamService } from '../services/nhom-san-pham.service';
import { JwtAuthGuard } from '@libs/common';
import {
    CreateNhomSanPhamDto,
    UpdateNhomSanPhamDto,
    QueryNhomSanPhamDto,
    NhomSanPhamResponseDto,
    NhomSanPhamListResponseDto,
} from '../dto/nhom-san-pham.dto';

@ApiTags('StockPile - Nhóm Sản Phẩm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('nhom-san-pham')
export class NhomSanPhamController {
    constructor(private readonly nhomSanPhamService: NhomSanPhamService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Tạo nhóm sản phẩm mới' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Nhóm sản phẩm được tạo thành công',
        type: NhomSanPhamResponseDto,
    })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Tên nhóm đã tồn tại' })
    async create(@Body() dto: CreateNhomSanPhamDto) {
        return this.nhomSanPhamService.create(dto);
    }

    @Get()
    @ApiOperation({
        summary: 'Danh sách nhóm sản phẩm',
        description: 'Lấy danh sách với phân trang, bao gồm số lượng sản phẩm trong mỗi nhóm',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách nhóm sản phẩm',
        type: NhomSanPhamListResponseDto,
    })
    async findAll(@Query() query: QueryNhomSanPhamDto) {
        return this.nhomSanPhamService.findAll(query);
    }

    @Get('count')
    @ApiOperation({ summary: 'Đếm tổng số nhóm sản phẩm' })
    @ApiResponse({ status: HttpStatus.OK })
    async count() {
        const count = await this.nhomSanPhamService.count();
        return { count };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết nhóm sản phẩm' })
    @ApiParam({ name: 'id', description: 'UUID của nhóm sản phẩm' })
    @ApiResponse({ status: HttpStatus.OK, type: NhomSanPhamResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy' })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.nhomSanPhamService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Cập nhật nhóm sản phẩm' })
    @ApiParam({ name: 'id', description: 'UUID của nhóm sản phẩm' })
    @ApiResponse({ status: HttpStatus.OK, type: NhomSanPhamResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Tên nhóm đã tồn tại' })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateNhomSanPhamDto,
    ) {
        return this.nhomSanPhamService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa nhóm sản phẩm (soft delete)' })
    @ApiParam({ name: 'id', description: 'UUID của nhóm sản phẩm' })
    @ApiResponse({ status: HttpStatus.OK })
    @ApiResponse({ status: HttpStatus.NOT_FOUND })
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.nhomSanPhamService.remove(id);
    }
}
