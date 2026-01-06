import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KhachHangService } from '../services/khach-hang.service';
import { JwtAuthGuard } from '@libs/common';

@ApiTags('Khách Hàng')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('khach-hang')
export class KhachHangController {
    constructor(private readonly khachHangService: KhachHangService) { }

    @Get()
    @ApiOperation({ summary: 'Danh sách khách hàng' })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('search') search?: string) {
        return this.khachHangService.findAll(page, limit, search);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết khách hàng' })
    findOne(@Param('id') id: string) {
        return this.khachHangService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Thêm khách hàng' })
    create(@Body() data: any) {
        return this.khachHangService.create(data);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Cập nhật khách hàng' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.khachHangService.update(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa khách hàng' })
    remove(@Param('id') id: string) {
        return this.khachHangService.remove(id);
    }
}
