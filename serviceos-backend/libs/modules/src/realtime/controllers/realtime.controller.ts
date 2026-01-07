/**
 * ============================================================
 * REALTIME CONTROLLER - REST API for Real-time Operations
 * ServiceOS - SaaS Backend - Phase 16
 * ============================================================
 * 
 * REST endpoints for triggering real-time notifications.
 * Used for testing and administrative purposes.
 */

import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse,
} from '@nestjs/swagger';
import { UserId, TenantId } from '@libs/common';
import { RealtimeService } from '../services/realtime.service';
import { NotificationEventDto, RealtimeEventType } from '../dto/realtime.dto';

class TestNotificationDto {
    title: string;
    message: string;
    userId?: string;
}

@ApiTags('Realtime')
@ApiBearerAuth()
@Controller('realtime')
export class RealtimeController {
    constructor(private readonly realtimeService: RealtimeService) { }

    /**
     * Send a test notification to the current user
     */
    @Post('test-notification')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Send test notification',
        description: 'Send a test notification to the current user via WebSocket.',
    })
    @ApiResponse({ status: 200, description: 'Notification sent successfully' })
    async sendTestNotification(
        @Body() dto: TestNotificationDto,
        @UserId() currentUserId: string,
        @TenantId() tenantId: string,
    ) {
        const targetUserId = dto.userId || currentUserId;

        const notification: NotificationEventDto = {
            id: `test-${Date.now()}`,
            tieuDe: dto.title || 'Thông báo thử nghiệm',
            noiDung: dto.message || 'Đây là thông báo thử nghiệm từ API.',
            loaiThongBao: 'SYSTEM',
            idDoiTuong: undefined,
            loaiDoiTuong: undefined,
        };

        const sent = this.realtimeService.notifyUser(targetUserId, notification);

        return {
            success: sent,
            message: sent
                ? 'Thông báo đã được gửi thành công'
                : 'Người dùng không trực tuyến, thông báo sẽ được gửi khi kết nối',
            notification,
        };
    }

    /**
     * Broadcast to all users in a tenant
     */
    @Post('broadcast')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Broadcast to tenant',
        description: 'Broadcast a message to all users in the current tenant.',
    })
    async broadcastToTenant(
        @Body() dto: { title: string; message: string },
        @TenantId() tenantId: string,
    ) {
        this.realtimeService.broadcastToAll({
            title: dto.title,
            message: dto.message,
            tenantId,
        });

        return {
            success: true,
            message: 'Thông báo đã được phát sóng đến tất cả người dùng trong doanh nghiệp',
        };
    }

    /**
     * Get online status
     */
    @Post('status')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Get realtime service status',
        description: 'Get the current status of the realtime service.',
    })
    async getStatus() {
        return {
            onlineUsers: this.realtimeService.getOnlineUsersCount(),
            status: 'healthy',
        };
    }
}
