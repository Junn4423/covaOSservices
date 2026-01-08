/**
 * ============================================================
 * JOBS ALIAS CONTROLLER - Frontend API Compatibility
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Cung cap API alias /jobs de tuong thich voi frontend.
 * Chuyen tiep request den CongViecService.
 * 
 * Frontend calls: /api/v1/jobs
 * This controller maps to: CongViecService (same as /techmate/cong-viec)
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
} from '@nestjs/swagger';
import { CongViecService } from '../services/cong-viec.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData, TenantId } from '@libs/common';
import {
    CreateCongViecDto,
    UpdateCongViecDto,
    QueryCongViecDto,
    UpdateStatusDto,
    CongViecResponseDto,
    CongViecListResponseDto,
} from '../dto/cong-viec.dto';

@ApiTags('Jobs (Alias for TechMate)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsAliasController {
    constructor(private readonly congViecService: CongViecService) { }

    // ----------------------------------------
    // POST /jobs - Tạo công việc mới
    // ----------------------------------------
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Tao cong viec moi' })
    @ApiBody({ type: CreateCongViecDto })
    @ApiResponse({ status: HttpStatus.CREATED, type: CongViecResponseDto })
    async create(
        @Body() dto: CreateCongViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.create(dto, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // GET /jobs - Danh sach cong viec
    // ----------------------------------------
    @Get()
    @ApiOperation({ summary: 'Danh sach cong viec' })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecListResponseDto })
    async findAll(
        @Query() query: QueryCongViecDto,
        @TenantId() tenantId: string,
    ) {
        return this.congViecService.findAll(query, tenantId);
    }

    // ----------------------------------------
    // GET /jobs/stats - Thong ke
    // ----------------------------------------
    @Get('stats')
    @ApiOperation({ summary: 'Thong ke cong viec' })
    async getStats(@TenantId() tenantId: string) {
        return this.congViecService.getStats(tenantId);
    }

    // ----------------------------------------
    // GET /jobs/count - Dem tong
    // ----------------------------------------
    @Get('count')
    @ApiOperation({ summary: 'Dem tong so cong viec' })
    async count(@TenantId() tenantId: string) {
        const count = await this.congViecService.count(tenantId);
        return { count };
    }

    // ----------------------------------------
    // GET /jobs/:id - Chi tiet
    // ----------------------------------------
    @Get(':id')
    @ApiOperation({ summary: 'Chi tiet cong viec' })
    @ApiParam({ name: 'id', description: 'UUID cong viec' })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.congViecService.findOne(id, tenantId);
    }

    // ----------------------------------------
    // PATCH /jobs/:id - Cap nhat
    // ----------------------------------------
    @Patch(':id')
    @ApiOperation({ summary: 'Cap nhat cong viec' })
    @ApiParam({ name: 'id', description: 'UUID cong viec' })
    @ApiBody({ type: UpdateCongViecDto })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateCongViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.update(id, dto, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // PATCH /jobs/:id/status - Chuyen trang thai
    // ----------------------------------------
    @Patch(':id/status')
    @ApiOperation({ summary: 'Chuyen trang thai cong viec' })
    @ApiParam({ name: 'id', description: 'UUID cong viec' })
    @ApiBody({ type: UpdateStatusDto })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    async updateStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateStatusDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.updateStatus(id, dto.trang_thai, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // DELETE /jobs/:id - Xoa (soft delete)
    // ----------------------------------------
    @Delete(':id')
    @ApiOperation({ summary: 'Xoa cong viec (soft delete)' })
    @ApiParam({ name: 'id', description: 'UUID cong viec' })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.remove(id, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // PATCH /jobs/:id/restore - Khoi phuc
    // ----------------------------------------
    @Patch(':id/restore')
    @ApiOperation({ summary: 'Khoi phuc cong viec da xoa' })
    @ApiParam({ name: 'id', description: 'UUID cong viec da xoa' })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    async restore(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.restore(id, user.id, user.id_doanh_nghiep);
    }
}
