/**
 * Người Dùng Controller
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NguoiDungService } from '../services/nguoi-dung.service';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/common';

@ApiTags('Người Dùng')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('nguoi-dung')
export class NguoiDungController {
    constructor(private readonly nguoiDungService: NguoiDungService) { }

    @Get()
    @ApiOperation({ summary: 'Danh sách nhân viên' })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.nguoiDungService.findAll(page, limit);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết nhân viên' })
    findOne(@Param('id') id: string) {
        return this.nguoiDungService.findOne(id);
    }

    @Post()
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Thêm nhân viên mới' })
    create(@Body() data: any) {
        return this.nguoiDungService.create(data);
    }

    @Put(':id')
    @Roles('admin', 'manager')
    @ApiOperation({ summary: 'Cập nhật nhân viên' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.nguoiDungService.update(id, data);
    }

    @Delete(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Xóa nhân viên' })
    remove(@Param('id') id: string) {
        return this.nguoiDungService.remove(id);
    }
}
