/**
 * ============================================================
 * CUSTOMERS ALIAS CONTROLLER - Frontend API Compatibility
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Cung cap API alias /customers va /techmate/khach-hang de tuong thich voi frontend.
 * Chuyen tiep request den KhachHangService.
 * 
 * Frontend calls: 
 *   - /api/v1/customers
 *   - /api/v1/techmate/khach-hang
 * 
 * This controller maps to: KhachHangService (same as /khach-hang)
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

// ============================================================
// CUSTOMERS ALIAS CONTROLLER (/customers)
// ============================================================
@ApiTags('Customers (Alias)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersAliasController {
    constructor(private readonly khachHangService: KhachHangService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Tao khach hang moi' })
    @ApiBody({ type: CreateKhachHangDto })
    @ApiResponse({ status: HttpStatus.CREATED, type: KhachHangResponseDto })
    async create(@Body() createDto: CreateKhachHangDto) {
        return this.khachHangService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Danh sach khach hang' })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangListResponseDto })
    async findAll(@Query() query: QueryKhachHangDto) {
        return this.khachHangService.findAll(query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Thong ke khach hang theo nguon' })
    async getStats() {
        return this.khachHangService.getStatsByNguonKhach();
    }

    @Get('count')
    @ApiOperation({ summary: 'Dem tong so khach hang' })
    async count() {
        const count = await this.khachHangService.count();
        return { count };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiet khach hang' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang' })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.khachHangService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Cap nhat thong tin khach hang' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang' })
    @ApiBody({ type: UpdateKhachHangDto })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateDto: UpdateKhachHangDto,
    ) {
        return this.khachHangService.update(id, updateDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Cap nhat mot phan thong tin khach hang' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang' })
    @ApiBody({ type: UpdateKhachHangDto })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async partialUpdate(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateDto: UpdateKhachHangDto,
    ) {
        return this.khachHangService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xoa khach hang (soft delete)' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang can xoa' })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.khachHangService.remove(id);
    }

    @Patch(':id/restore')
    @ApiOperation({ summary: 'Khoi phuc khach hang da xoa' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang can khoi phuc' })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async restore(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.khachHangService.restore(id);
    }
}

// ============================================================
// TECHMATE/KHACH-HANG ALIAS CONTROLLER (/techmate/khach-hang)
// ============================================================
@ApiTags('TechMate - Khach Hang (Alias)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('techmate/khach-hang')
export class TechMateKhachHangAliasController {
    constructor(private readonly khachHangService: KhachHangService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Tao khach hang moi' })
    @ApiBody({ type: CreateKhachHangDto })
    @ApiResponse({ status: HttpStatus.CREATED, type: KhachHangResponseDto })
    async create(@Body() createDto: CreateKhachHangDto) {
        return this.khachHangService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Danh sach khach hang' })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangListResponseDto })
    async findAll(@Query() query: QueryKhachHangDto) {
        return this.khachHangService.findAll(query);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Thong ke khach hang theo nguon' })
    async getStats() {
        return this.khachHangService.getStatsByNguonKhach();
    }

    @Get('count')
    @ApiOperation({ summary: 'Dem tong so khach hang' })
    async count() {
        const count = await this.khachHangService.count();
        return { count };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiet khach hang' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang' })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.khachHangService.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Cap nhat thong tin khach hang' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang' })
    @ApiBody({ type: UpdateKhachHangDto })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateDto: UpdateKhachHangDto,
    ) {
        return this.khachHangService.update(id, updateDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Cap nhat mot phan thong tin khach hang' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang' })
    @ApiBody({ type: UpdateKhachHangDto })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async partialUpdate(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() updateDto: UpdateKhachHangDto,
    ) {
        return this.khachHangService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xoa khach hang (soft delete)' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang can xoa' })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.khachHangService.remove(id);
    }

    @Patch(':id/restore')
    @ApiOperation({ summary: 'Khoi phuc khach hang da xoa' })
    @ApiParam({ name: 'id', description: 'UUID cua khach hang can khoi phuc' })
    @ApiResponse({ status: HttpStatus.OK, type: KhachHangResponseDto })
    async restore(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.khachHangService.restore(id);
    }
}
