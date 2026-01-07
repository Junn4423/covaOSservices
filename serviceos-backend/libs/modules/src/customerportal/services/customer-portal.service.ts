/**
 * ============================================================
 * CUSTOMER PORTAL SERVICE - CustomerPortal Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Tính năng cổng khách hàng chính:
 * - getProfile: Lấy thông tin chi tiết khách hàng từ KhachHang
 * - getMyJobs: Danh sách công việc của khách hàng hiện tại
 * - getMyQuotes: Danh sách báo giá của khách hàng hiện tại
 * - createReview: Gửi đánh giá cho công việc đã hoàn thành
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import {
    QueryCustomerJobsDto,
    QueryCustomerQuotesDto,
    CreateReviewDto,
} from '../dto/customer-portal.dto';

// Hằng số trạng thái
const TRANG_THAI_HOAN_THANH = 2;

@Injectable()
export class CustomerPortalService {
    private readonly logger = new Logger(CustomerPortalService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================================
    // GET PROFILE - Thông tin chi tiết khách hàng từ KhachHang
    // ============================================================
    async getProfile(khachHangId: string, tenantId: string) {
        const khachHang = await this.prisma.runAsSystem(async () => {
            return this.prisma.khachHang.findFirst({
                where: {
                    id: khachHangId,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
                select: {
                    id: true,
                    ma_khach_hang: true,
                    ho_ten: true,
                    so_dien_thoai: true,
                    email: true,
                    dia_chi: true,
                    thanh_pho: true,
                    quan_huyen: true,
                    loai_khach: true,
                    nguon_khach: true,
                    ngay_tao: true,
                },
            });
        });

        if (!khachHang) {
            throw new NotFoundException('Không tìm thấy thông tin khách hàng');
        }

        return khachHang;
    }

    // ============================================================
    // GET MY JOBS - Danh sách công việc của khách hàng hiện tại
    // ============================================================
    /**
     * Lấy danh sách công việc có phân trang cho khách hàng
     * Bao gồm trạng thái, ngày tháng, và thông tin kỹ thuật viên
     */
    async getMyJobs(
        khachHangId: string,
        tenantId: string,
        query: QueryCustomerJobsDto,
    ) {
        const { page = 1, limit = 20, trang_thai } = query;
        const skip = (page - 1) * limit;

        // Xây dựng điều kiện where
        const where: any = {
            id_khach_hang: khachHangId,
            id_doanh_nghiep: tenantId,
            ngay_xoa: null,
        };

        if (trang_thai !== undefined) {
            where.trang_thai = trang_thai;
        }

        const [data, total] = await Promise.all([
            this.prisma.runAsSystem(async () => {
                return this.prisma.congViec.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { ngay_tao: 'desc' },
                    select: {
                        id: true,
                        ma_cong_viec: true,
                        tieu_de: true,
                        mo_ta: true,
                        trang_thai: true,
                        ngay_hen: true,
                        ngay_hoan_thanh: true,
                        dia_chi_lam_viec: true,
                        ngay_tao: true,
                        phan_cong: {
                            where: { ngay_xoa: null },
                            select: {
                                id: true,
                                la_truong_nhom: true,
                                trang_thai: true,
                                nguoi_dung: {
                                    select: {
                                        id: true,
                                        ho_ten: true,
                                        so_dien_thoai: true,
                                        anh_dai_dien: true,
                                    },
                                },
                            },
                        },
                    },
                });
            }),
            this.prisma.runAsSystem(async () => {
                return this.prisma.congViec.count({ where });
            }),
        ]);

        // Transform để làm phẳng thông tin kỹ thuật viên
        const transformedData = data.map((job) => ({
            ...job,
            phan_cong: job.phan_cong.map((pc) => ({
                id: pc.nguoi_dung.id,
                ho_ten: pc.nguoi_dung.ho_ten,
                so_dien_thoai: pc.nguoi_dung.so_dien_thoai,
                anh_dai_dien: pc.nguoi_dung.anh_dai_dien,
                la_truong_nhom: pc.la_truong_nhom,
                trang_thai_phan_cong: pc.trang_thai,
            })),
        }));

        return {
            data: transformedData,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // GET MY QUOTES - Danh sách báo giá của khách hàng hiện tại
    // ============================================================
    /**
     * Lấy danh sách báo giá có phân trang cho khách hàng
     */
    async getMyQuotes(
        khachHangId: string,
        tenantId: string,
        query: QueryCustomerQuotesDto,
    ) {
        const { page = 1, limit = 20, trang_thai } = query;
        const skip = (page - 1) * limit;

        // Xây dựng điều kiện where
        const where: any = {
            id_khach_hang: khachHangId,
            id_doanh_nghiep: tenantId,
            ngay_xoa: null,
        };

        if (trang_thai) {
            where.trang_thai = trang_thai;
        }

        const [data, total] = await Promise.all([
            this.prisma.runAsSystem(async () => {
                return this.prisma.baoGia.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { ngay_tao: 'desc' },
                    include: {
                        chi_tiet: {
                            where: { ngay_xoa: null },
                            include: {
                                san_pham: {
                                    select: {
                                        id: true,
                                        ma_san_pham: true,
                                        ten_san_pham: true,
                                        don_vi_tinh: true,
                                    },
                                },
                            },
                        },
                    },
                });
            }),
            this.prisma.runAsSystem(async () => {
                return this.prisma.baoGia.count({ where });
            }),
        ]);

        // Transform các trường Decimal sang number
        const transformedData = data.map((quote) => ({
            ...quote,
            tong_tien_truoc_thue: this.decimalToNumber(quote.tong_tien_truoc_thue),
            thue_vat: this.decimalToNumber(quote.thue_vat),
            tien_thue: this.decimalToNumber(quote.tien_thue),
            tong_tien_sau_thue: this.decimalToNumber(quote.tong_tien_sau_thue),
            chi_tiet: quote.chi_tiet.map((item) => ({
                ...item,
                don_gia: this.decimalToNumber(item.don_gia),
                thanh_tien: this.decimalToNumber(item.thanh_tien),
            })),
        }));

        return {
            data: transformedData,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // CREATE REVIEW - Gửi đánh giá cho công việc đã hoàn thành
    // ============================================================
    /**
     * Tạo đánh giá cho công việc đã hoàn thành
     * 
     * Validation:
     * - Công việc phải thuộc về khách hàng
     * - Công việc phải hoàn thành (trang_thai = 2)
     * - Mỗi công việc chỉ được đánh giá một lần
     */
    async createReview(
        dto: CreateReviewDto,
        khachHangId: string,
        tenantId: string,
        accountId: string,
    ) {
        // 1. Kiểm tra công việc tồn tại và thuộc về khách hàng
        const congViec = await this.prisma.runAsSystem(async () => {
            return this.prisma.congViec.findFirst({
                where: {
                    id: dto.cong_viec_id,
                    id_khach_hang: khachHangId,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
            });
        });

        if (!congViec) {
            throw new NotFoundException('Không tìm thấy công việc hoặc công việc không thuộc về bạn');
        }

        // 2. Kiểm tra công việc đã hoàn thành
        if (congViec.trang_thai !== TRANG_THAI_HOAN_THANH) {
            throw new BadRequestException('Chỉ có thể đánh giá công việc đã hoàn thành');
        }

        // 3. Kiểm tra đã đánh giá chưa
        const existingReview = await this.prisma.runAsSystem(async () => {
            return this.prisma.danhGia.findFirst({
                where: {
                    id_cong_viec: dto.cong_viec_id,
                    id_khach_hang: khachHangId,
                    ngay_xoa: null,
                },
            });
        });

        if (existingReview) {
            throw new ConflictException('Bạn đã đánh giá công việc này rồi');
        }

        // 4. Tạo đánh giá
        const danhGia = await this.prisma.runAsSystem(async () => {
            return this.prisma.danhGia.create({
                data: {
                    id: uuidv4(),
                    id_doanh_nghiep: tenantId,
                    id_cong_viec: dto.cong_viec_id,
                    id_khach_hang: khachHangId,
                    so_sao: dto.so_sao,
                    nhan_xet: dto.nhan_xet,
                    nguoi_tao_id: accountId,
                },
                include: {
                    cong_viec: {
                        select: {
                            id: true,
                            ma_cong_viec: true,
                            tieu_de: true,
                        },
                    },
                },
            });
        });

        this.logger.log(`Đã tạo đánh giá: ${danhGia.id} cho công việc ${dto.cong_viec_id}`);

        return danhGia;
    }

    // ============================================================
    // GET MY REVIEWS - Danh sách đánh giá của khách hàng
    // ============================================================
    async getMyReviews(khachHangId: string, tenantId: string) {
        const reviews = await this.prisma.runAsSystem(async () => {
            return this.prisma.danhGia.findMany({
                where: {
                    id_khach_hang: khachHangId,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
                orderBy: { ngay_tao: 'desc' },
                include: {
                    cong_viec: {
                        select: {
                            id: true,
                            ma_cong_viec: true,
                            tieu_de: true,
                        },
                    },
                },
            });
        });

        return { data: reviews };
    }

    // ============================================================
    // HELPER: Chuyển đổi Decimal sang Number
    // ============================================================
    private decimalToNumber(value: any): number {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        return typeof value.toNumber === 'function' ? value.toNumber() : Number(value);
    }
}
