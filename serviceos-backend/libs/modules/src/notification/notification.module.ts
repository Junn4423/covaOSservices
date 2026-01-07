/**
 * ============================================================
 * NOTIFICATION MODULE - Hệ thống thông báo
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Module quản lý thông báo hệ thống:
 * - ThongBaoService: Logic nghiệp vụ thông báo
 * - ThongBaoController: API endpoints cho người dùng (NguoiDung)
 * 
 * Endpoints:
 * - GET    /notification           - Danh sách thông báo
 * - GET    /notification/unread-count - Số lượng chưa đọc
 * - GET    /notification/:id       - Chi tiết thông báo
 * - PATCH  /notification/:id/read  - Đánh dấu đã đọc
 * - POST   /notification/mark-all-read - Đánh dấu tất cả đã đọc
 * - DELETE /notification/:id       - Xóa thông báo
 */

import { Module } from '@nestjs/common';
import { ThongBaoService } from './services/thong-bao.service';
import { ThongBaoController } from './controllers/thong-bao.controller';

@Module({
    controllers: [ThongBaoController],
    providers: [ThongBaoService],
    exports: [ThongBaoService], // Export để sử dụng trong các module khác (TechMate, QuoteMaster)
})
export class NotificationModule { }
