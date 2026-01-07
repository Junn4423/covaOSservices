/**
 * ============================================================
 * THÔNG BÁO CONTROLLER - Notification Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * API Endpoints cho Thông báo (NguoiDung):
 * - GET    /notification           - Danh sách thông báo của tôi
 * - GET    /notification/unread-count - Số lượng chưa đọc
 * - GET    /notification/:id       - Chi tiết thông báo
 * - PATCH  /notification/:id/read  - Đánh dấu đã đọc
 * - POST   /notification/mark-all-read - Đánh dấu tất cả đã đọc
 * - DELETE /notification/:id       - Xóa thông báo
 */

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiExtraModels,
} from '@nestjs/swagger';
import { ThongBaoService } from '../services/thong-bao.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData, TenantId } from '@libs/common';
import {
    QueryNotificationDto,
    NotificationResponseDto,
    NotificationListResponseDto,
} from '../dto/thong-bao.dto';

@ApiTags('Notification - Thông Báo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(NotificationResponseDto, NotificationListResponseDto)
@Controller('notification')
export class ThongBaoController {
    constructor(private readonly thongBaoService: ThongBaoService) { }

    // ----------------------------------------
    // GET /notification - Danh sách thông báo của tôi
    // ----------------------------------------
    @Get()
    @ApiOperation({
        summary: 'Danh sách thông báo của tôi',
        description: `
Lấy danh sách thông báo cho user hiện tại.

**Bộ lọc:**
- \`da_xem\`: true (đã đọc) / false (chưa đọc)
- \`loai_thong_bao\`: PHAN_CONG, BAO_GIA_DUOC_CHAP_NHAN, HE_THONG, v.v.

**Phân trang:** page, limit (mặc định 20)
        `,
    })
    @ApiResponse({ status: HttpStatus.OK, type: NotificationListResponseDto })
    async getMyNotifications(
        @Query() query: QueryNotificationDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.thongBaoService.getMyNotifications(
            user.id,
            user.id_doanh_nghiep,
            query,
        );
    }

    // ----------------------------------------
    // GET /notification/unread-count - Số lượng chưa đọc
    // ----------------------------------------
    @Get('unread-count')
    @ApiOperation({
        summary: 'Số lượng thông báo chưa đọc',
        description: 'Lấy số lượng thông báo chưa đọc để hiển thị badge',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: {
                unread_count: { type: 'number', example: 5 },
            },
        },
    })
    async getUnreadCount(@ActiveUser() user: ActiveUserData) {
        return this.thongBaoService.getUnreadCount(user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // GET /notification/:id - Chi tiết thông báo
    // ----------------------------------------
    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết thông báo' })
    @ApiParam({ name: 'id', description: 'UUID thông báo' })
    @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy thông báo' })
    async getOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.thongBaoService.getOne(id, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // PATCH /notification/:id/read - Đánh dấu đã đọc
    // ----------------------------------------
    @Patch(':id/read')
    @ApiOperation({
        summary: 'Đánh dấu thông báo đã đọc',
        description: 'Cập nhật da_xem = 1 cho thông báo cụ thể',
    })
    @ApiParam({ name: 'id', description: 'UUID thông báo' })
    @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy thông báo' })
    async markAsRead(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.thongBaoService.markAsRead(id, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // POST /notification/mark-all-read - Đánh dấu tất cả đã đọc
    // ----------------------------------------
    @Post('mark-all-read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Đánh dấu tất cả thông báo đã đọc',
        description: 'Cập nhật tất cả thông báo chưa đọc thành đã đọc',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: {
                count: { type: 'number', example: 10 },
                message: { type: 'string', example: 'Đã đánh dấu 10 thông báo là đã đọc' },
            },
        },
    })
    async markAllRead(@ActiveUser() user: ActiveUserData) {
        return this.thongBaoService.markAllRead(user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // DELETE /notification/:id - Xóa thông báo
    // ----------------------------------------
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa thông báo (soft delete)',
        description: 'Xóa mềm thông báo',
    })
    @ApiParam({ name: 'id', description: 'UUID thông báo' })
    @ApiResponse({ status: HttpStatus.OK, type: NotificationResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy thông báo' })
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.thongBaoService.remove(id, user.id, user.id_doanh_nghiep);
    }
}
