/**
 * ============================================================
 * KHÁCH HÀNG SERVICE - TechMate CRM Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Service xử lý nghiệp vụ quản lý khách hàng.
 *
 * 🔒 MULTI-TENANT SECURITY:
 * - KHÔNG cần viết `where: { id_doanh_nghiep }` thủ công
 * - CLS Middleware trong PrismaService tự động inject tenant filter
 * - Mọi query đều được filter theo tenant của user hiện tại
 */

import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import {
    CreateKhachHangDto,
    UpdateKhachHangDto,
    QueryKhachHangDto,
} from '../dto/khach-hang.dto';

// Type alias - sử dụng Record type, sẽ được thay bằng Prisma types sau khi generate
type KhachHangWhereInput = Record<string, any>;

@Injectable()
export class KhachHangService {
    private readonly logger = new Logger(KhachHangService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * ============================================================
     * CREATE - Tạo khách hàng mới
     * ============================================================
     *
     * @param dto CreateKhachHangDto
     * @returns Khách hàng vừa tạo
     *
     * Features:
     * - Auto-generate ma_khach_hang nếu không gửi (Format: KH-{Timestamp})
     * - id_doanh_nghiep được inject tự động bởi CLS Middleware
     * - nguoi_tao_id được inject tự động bởi CLS Middleware
     */
    async create(dto: CreateKhachHangDto) {
        // Auto-generate mã khách hàng nếu không có
        const maKhachHang = dto.ma_khach_hang || `KH-${Date.now()}`;

        // Kiểm tra trùng mã khách hàng (trong cùng tenant)
        // CLS Middleware sẽ tự động thêm id_doanh_nghiep vào where clause
        const existing = await this.prisma.khachHang.findFirst({
            where: { ma_khach_hang: maKhachHang },
        });

        if (existing) {
            throw new ConflictException(
                `Mã khách hàng "${maKhachHang}" đã tồn tại trong hệ thống`,
            );
        }

        // Tạo khách hàng mới
        // id_doanh_nghiep, nguoi_tao_id, nguoi_cap_nhat_id được inject tự động
        const khachHang = await this.prisma.khachHang.create({
            data: {
                id: uuidv4(),
                ma_khach_hang: maKhachHang,
                ho_ten: dto.ho_ten,
                so_dien_thoai: dto.so_dien_thoai,
                email: dto.email,
                dia_chi: dto.dia_chi,
                thanh_pho: dto.thanh_pho,
                quan_huyen: dto.quan_huyen,
                loai_khach: dto.loai_khach,
                nguon_khach: dto.nguon_khach,
                ghi_chu: dto.ghi_chu,
            } as any, // Cast to any vì id_doanh_nghiep được inject bởi middleware
        });

        this.logger.log(`Tạo khách hàng mới: ${khachHang.id} - ${khachHang.ho_ten}`);
        return khachHang;
    }

    /**
     * ============================================================
     * FIND ALL - Lấy danh sách có phân trang + tìm kiếm
     * ============================================================
     *
     * @param query QueryKhachHangDto
     * @returns { data: KhachHang[], meta: PaginationMeta }
     *
     * Features:
     * - Phân trang (page, limit)
     * - Tìm kiếm theo tên, SĐT, email
     * - Lọc theo nguồn khách, loại khách
     * - Tự động filter theo tenant nhờ CLS Middleware
     * - Tự động exclude soft-deleted records (ngay_xoa = null)
     */
    async findAll(query: QueryKhachHangDto) {
        const { page = 1, limit = 20, search, nguon_khach, loai_khach } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: KhachHangWhereInput = {};

        // Search conditions (tên, SĐT, email)
        if (search) {
            where.OR = [
                { ho_ten: { contains: search } },
                { so_dien_thoai: { contains: search } },
                { email: { contains: search } },
                { ma_khach_hang: { contains: search } },
            ];
        }

        // Filter by nguon_khach
        if (nguon_khach) {
            where.nguon_khach = nguon_khach;
        }

        // Filter by loai_khach
        if (loai_khach) {
            where.loai_khach = loai_khach;
        }

        // id_doanh_nghiep và ngay_xoa = null được inject tự động bởi CLS Middleware

        // Execute parallel queries for data and count
        const [data, total] = await Promise.all([
            this.prisma.khachHang.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
            }),
            this.prisma.khachHang.count({ where }),
        ]);

        this.logger.debug(`Tìm thấy ${data.length}/${total} khách hàng`);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * ============================================================
     * FIND ONE - Lấy chi tiết khách hàng
     * ============================================================
     *
     * @param id UUID của khách hàng
     * @returns Khách hàng chi tiết
     * @throws NotFoundException nếu không tìm thấy
     */
    async findOne(id: string) {
        const khachHang = await this.prisma.khachHang.findFirst({
            where: { id },
            // CLS Middleware tự động thêm: id_doanh_nghiep, ngay_xoa = null
        });

        if (!khachHang) {
            throw new NotFoundException(`Không tìm thấy khách hàng với ID: ${id}`);
        }

        return khachHang;
    }

    /**
     * ============================================================
     * FIND BY MA_KHACH_HANG - Tìm theo mã khách hàng
     * ============================================================
     */
    async findByMaKhachHang(maKhachHang: string) {
        const khachHang = await this.prisma.khachHang.findFirst({
            where: { ma_khach_hang: maKhachHang },
        });

        if (!khachHang) {
            throw new NotFoundException(
                `Không tìm thấy khách hàng với mã: ${maKhachHang}`,
            );
        }

        return khachHang;
    }

    /**
     * ============================================================
     * UPDATE - Cập nhật thông tin khách hàng
     * ============================================================
     *
     * @param id UUID của khách hàng
     * @param dto UpdateKhachHangDto
     * @returns Khách hàng đã cập nhật
     */
    async update(id: string, dto: UpdateKhachHangDto) {
        // Kiểm tra khách hàng tồn tại
        await this.findOne(id);

        // Nếu update ma_khach_hang, kiểm tra trùng
        if (dto.ma_khach_hang) {
            const existing = await this.prisma.khachHang.findFirst({
                where: {
                    ma_khach_hang: dto.ma_khach_hang,
                    id: { not: id }, // Exclude current record
                },
            });

            if (existing) {
                throw new ConflictException(
                    `Mã khách hàng "${dto.ma_khach_hang}" đã được sử dụng`,
                );
            }
        }

        // Update với các fields có trong dto
        // nguoi_cap_nhat_id được inject tự động bởi CLS Middleware
        const khachHang = await this.prisma.khachHang.update({
            where: { id },
            data: {
                ...(dto.ma_khach_hang && { ma_khach_hang: dto.ma_khach_hang }),
                ...(dto.ho_ten && { ho_ten: dto.ho_ten }),
                ...(dto.so_dien_thoai !== undefined && {
                    so_dien_thoai: dto.so_dien_thoai,
                }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.dia_chi !== undefined && { dia_chi: dto.dia_chi }),
                ...(dto.thanh_pho !== undefined && { thanh_pho: dto.thanh_pho }),
                ...(dto.quan_huyen !== undefined && { quan_huyen: dto.quan_huyen }),
                ...(dto.loai_khach && { loai_khach: dto.loai_khach }),
                ...(dto.nguon_khach && { nguon_khach: dto.nguon_khach }),
                ...(dto.ghi_chu !== undefined && { ghi_chu: dto.ghi_chu }),
            },
        });

        this.logger.log(`Cập nhật khách hàng: ${id}`);
        return khachHang;
    }

    /**
     * ============================================================
     * REMOVE - Xóa mềm khách hàng (Soft Delete)
     * ============================================================
     *
     * @param id UUID của khách hàng
     * @returns Khách hàng đã xóa (với ngay_xoa được set)
     *
     * Note: CLS Middleware tự động convert delete thành soft delete
     * bằng cách set ngay_xoa = new Date()
     */
    async remove(id: string) {
        // Kiểm tra khách hàng tồn tại
        await this.findOne(id);

        // Soft delete - CLS Middleware sẽ convert thành update với ngay_xoa
        const khachHang = await this.prisma.khachHang.delete({
            where: { id },
        });

        this.logger.log(`Xóa mềm khách hàng: ${id}`);
        return khachHang;
    }

    /**
     * ============================================================
     * RESTORE - Khôi phục khách hàng đã xóa
     * ============================================================
     */
    async restore(id: string) {
        // Tìm khách hàng đã xóa (phải bypass soft delete filter)
        const khachHang = await this.prisma.khachHang.findFirst({
            where: {
                id,
                ngay_xoa: { not: null }, // Đã bị xóa mềm
            },
        });

        if (!khachHang) {
            throw new NotFoundException(
                `Không tìm thấy khách hàng đã xóa với ID: ${id}`,
            );
        }

        // Khôi phục
        const restored = await this.prisma.khachHang.update({
            where: { id },
            data: { ngay_xoa: null },
        });

        this.logger.log(`Khôi phục khách hàng: ${id}`);
        return restored;
    }

    /**
     * ============================================================
     * COUNT - Đếm số khách hàng (for dashboard)
     * ============================================================
     */
    async count() {
        return this.prisma.khachHang.count({});
    }

    /**
     * ============================================================
     * STATISTICS - Thống kê theo nguồn khách
     * ============================================================
     */
    async getStatsByNguonKhach() {
        // Cast to any vì Prisma types chưa được generate với schema mới
        // Sau khi chạy `prisma generate`, có thể remove cast này
        const stats = await (this.prisma.khachHang.groupBy as any)({
            by: ['nguon_khach'],
            _count: { id: true },
        });

        return stats.map((s: any) => ({
            nguon_khach: s.nguon_khach,
            count: s._count?.id || 0,
        }));
    }
}
