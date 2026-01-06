import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CongViecService } from '../services/cong-viec.service';
import { PhanCongService } from '../services/phan-cong.service';
import { JwtAuthGuard } from '@libs/common';

@ApiTags('Công Việc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cong-viec')
export class CongViecController {
    constructor(
        private readonly congViecService: CongViecService,
        private readonly phanCongService: PhanCongService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Danh sách công việc' })
    findAll(@Query() filters: any) {
        return this.congViecService.findAll(filters);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết công việc' })
    findOne(@Param('id') id: string) {
        return this.congViecService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Tạo công việc mới' })
    create(@Body() data: any) {
        return this.congViecService.create(data);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Cập nhật công việc' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.congViecService.update(id, data);
    }

    @Put(':id/status')
    @ApiOperation({ summary: 'Cập nhật trạng thái' })
    updateStatus(@Param('id') id: string, @Body('trang_thai') trang_thai: number) {
        return this.congViecService.updateStatus(id, trang_thai);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa công việc' })
    remove(@Param('id') id: string) {
        return this.congViecService.remove(id);
    }

    @Post(':id/phan-cong')
    @ApiOperation({ summary: 'Phân công thợ' })
    assign(@Param('id') id: string, @Body() data: { id_nguoi_dung: string; la_truong_nhom?: boolean }) {
        return this.phanCongService.assign(id, data.id_nguoi_dung, data.la_truong_nhom);
    }

    @Delete(':id/phan-cong/:userId')
    @ApiOperation({ summary: 'Hủy phân công' })
    unassign(@Param('id') id: string, @Param('userId') userId: string) {
        return this.phanCongService.unassign(id, userId);
    }
}
