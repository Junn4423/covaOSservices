/**
 * Doanh Nghiệp Controller
 */

import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DoanhNghiepService } from '../services/doanh-nghiep.service';
import { JwtAuthGuard, RolesGuard, Roles, TenantId } from '@libs/common';

@ApiTags('Doanh Nghiệp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doanh-nghiep')
export class DoanhNghiepController {
    constructor(private readonly doanhNghiepService: DoanhNghiepService) { }

    @Get('profile')
    @ApiOperation({ summary: 'Thông tin doanh nghiệp' })
    getProfile(@TenantId() tenantId: string) {
        return this.doanhNghiepService.getProfile(tenantId);
    }

    @Put('profile')
    @Roles('admin')
    @ApiOperation({ summary: 'Cập nhật thông tin doanh nghiệp' })
    updateProfile(@TenantId() tenantId: string, @Body() data: any) {
        return this.doanhNghiepService.updateProfile(tenantId, data);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Thống kê tổng quan' })
    getStats(@TenantId() tenantId: string) {
        return this.doanhNghiepService.getStats(tenantId);
    }
}
