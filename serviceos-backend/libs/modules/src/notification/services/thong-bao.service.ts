/**
 * ============================================================
 * THÔNG BÁO SERVICE - Notification Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Notification engine cho cảnh báo hệ thống:
 * - createNotification: Phương thức nội bộ tạo thông báo
 * - getMyNotifications: Danh sách thông báo của user hiện tại
 * - markAsRead: Đánh dấu một thông báo đã đọc
 * - markAllRead: Đánh dấu tất cả thông báo chưa đọc thành đã đọc
 * - getUnreadCount: Lấy số lượng thông báo chưa đọc
 */

import {
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import {
    CreateNotificationDto,
    QueryNotificationDto,
    LoaiThongBao,
    LoaiDoiTuong,
} from '../dto/thong-bao.dto';

@Injectable()
export class ThongBaoService {
    private readonly logger = new Logger(ThongBaoService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================================
    // CREATE NOTIFICATION - Phương thức nội bộ Service
    // ============================================================
    /**
     * Tạo thông báo cho người dùng
     * Phương thức này được gọi bởi các service khác (VD: PhanCongService, BaoGiaService)
     * 
     * @param dto - Dữ liệu thông báo
     * @param tenantId - ID doanh nghiệp
     * @param creatorId - ID người tạo (tùy chọn)
     */
    async createNotification(
        dto: CreateNotificationDto,
        tenantId: string,
        creatorId?: string,
    ) {
        // Kiểm tra người nhận tồn tại và thuộc cùng tenant
        const nguoiNhan = await this.prisma.runAsSystem(async () => {
            return this.prisma.nguoiDung.findFirst({
                where: {
                    id: dto.id_nguoi_nhan,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
            });
        });

        if (!nguoiNhan) {
            this.logger.warn(`Không tìm thấy người nhận: ${dto.id_nguoi_nhan}`);
            return null; // Không làm gián đoạn luồng chính
        }

        const thongBao = await this.prisma.runAsSystem(async () => {
            return this.prisma.thongBao.create({
                data: {
                    id: uuidv4(),
                    id_doanh_nghiep: tenantId,
                    id_nguoi_nhan: dto.id_nguoi_nhan,
                    tieu_de: dto.tieu_de,
                    noi_dung: dto.noi_dung,
                    loai_thong_bao: dto.loai_thong_bao || LoaiThongBao.KHAC,
                    id_doi_tuong_lien_quan: dto.id_doi_tuong_lien_quan,
                    loai_doi_tuong: dto.loai_doi_tuong,
                    da_xem: 0,
                    nguoi_tao_id: creatorId,
                },
            });
        });

        this.logger.log(`Đã tạo thông báo: ${thongBao.id} cho user ${dto.id_nguoi_nhan}`);
        return thongBao;
    }

    // ============================================================
    // GET MY NOTIFICATIONS - Danh sách thông báo của user hiện tại
    // ============================================================
    /**
     * Lấy danh sách thông báo có phân trang cho user hiện tại
     * Hỗ trợ lọc theo trạng thái đọc và loại thông báo
     */
    async getMyNotifications(
        userId: string,
        tenantId: string,
        query: QueryNotificationDto,
    ) {
        const { page = 1, limit = 20, da_xem, loai_thong_bao } = query;
        const skip = (page - 1) * limit;

        // Xây dựng điều kiện where
        const where: any = {
            id_nguoi_nhan: userId,
            id_doanh_nghiep: tenantId,
            ngay_xoa: null,
        };

        // Lọc theo trạng thái đọc
        if (da_xem !== undefined) {
            where.da_xem = da_xem ? 1 : 0;
        }

        // Lọc theo loại thông báo
        if (loai_thong_bao) {
            where.loai_thong_bao = loai_thong_bao;
        }

        const [data, total, unreadCount] = await Promise.all([
            this.prisma.thongBao.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
            }),
            this.prisma.thongBao.count({ where }),
            this.prisma.thongBao.count({
                where: {
                    id_nguoi_nhan: userId,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                    da_xem: 0,
                },
            }),
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                unread_count: unreadCount,
            },
        };
    }

    // ============================================================
    // GET ONE NOTIFICATION - Lấy chi tiết thông báo
    // ============================================================
    async getOne(notificationId: string, userId: string, tenantId: string) {
        const thongBao = await this.prisma.thongBao.findFirst({
            where: {
                id: notificationId,
                id_nguoi_nhan: userId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!thongBao) {
            throw new NotFoundException('Không tìm thấy thông báo');
        }

        return thongBao;
    }

    // ============================================================
    // MARK AS READ - Đánh dấu một thông báo đã đọc
    // ============================================================
    /**
     * Đánh dấu một thông báo là đã đọc
     */
    async markAsRead(notificationId: string, userId: string, tenantId: string) {
        // Xác minh thông báo thuộc về user hiện tại
        const thongBao = await this.getOne(notificationId, userId, tenantId);

        // Đã đọc rồi, trả về như cũ
        if (thongBao.da_xem === 1) {
            return thongBao;
        }

        const updated = await this.prisma.thongBao.update({
            where: { id: notificationId },
            data: {
                da_xem: 1,
                ngay_xem: new Date(),
                nguoi_cap_nhat_id: userId,
            },
        });

        this.logger.log(`Đã đánh dấu thông báo đã đọc: ${notificationId}`);
        return updated;
    }

    // ============================================================
    // MARK ALL READ - Đánh dấu tất cả thông báo đã đọc
    // ============================================================
    /**
     * Đánh dấu tất cả thông báo chưa đọc thành đã đọc cho user hiện tại
     */
    async markAllRead(userId: string, tenantId: string) {
        const result = await this.prisma.thongBao.updateMany({
            where: {
                id_nguoi_nhan: userId,
                id_doanh_nghiep: tenantId,
                da_xem: 0,
                ngay_xoa: null,
            },
            data: {
                da_xem: 1,
                ngay_xem: new Date(),
                nguoi_cap_nhat_id: userId,
            },
        });

        this.logger.log(`Đã đánh dấu ${result.count} thông báo là đã đọc cho user ${userId}`);
        return {
            count: result.count,
            message: `Đã đánh dấu ${result.count} thông báo là đã đọc`,
        };
    }

    // ============================================================
    // GET UNREAD COUNT - Lấy số lượng thông báo chưa đọc
    // ============================================================
    /**
     * Lấy số lượng thông báo chưa đọc cho user hiện tại
     */
    async getUnreadCount(userId: string, tenantId: string) {
        const count = await this.prisma.thongBao.count({
            where: {
                id_nguoi_nhan: userId,
                id_doanh_nghiep: tenantId,
                da_xem: 0,
                ngay_xoa: null,
            },
        });

        return { unread_count: count };
    }

    // ============================================================
    // DELETE NOTIFICATION - Xóa thông báo (Soft Delete)
    // ============================================================
    async remove(notificationId: string, userId: string, tenantId: string) {
        await this.getOne(notificationId, userId, tenantId);

        const deleted = await this.prisma.thongBao.update({
            where: { id: notificationId },
            data: {
                ngay_xoa: new Date(),
                nguoi_cap_nhat_id: userId,
            },
        });

        return deleted;
    }
}
