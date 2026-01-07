/**
 * ============================================================
 * CÔNG VIỆC SERVICE - TechMate Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Logic nghiệp vụ quản lý Công Việc (Jobs):
 * - create: Tạo công việc mới (auto-gen ma_cong_viec)
 * - findAll: Lấy danh sách với filter, pagination
 * - findOne: Lấy chi tiết công việc
 * - update: Cập nhật thông tin công việc
 * - updateStatus: Chuyển trạng thái workflow
 * - getMyJobs: Lấy công việc được phân công cho user (Mobile API)
 * - remove: Soft delete
 * - restore: Khôi phục
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import {
    CreateCongViecDto,
    UpdateCongViecDto,
    QueryCongViecDto,
    TrangThaiCongViec,
} from '../dto/cong-viec.dto';

@Injectable()
export class CongViecService {
    constructor(private prisma: PrismaService) { }

    // ============================================================
    // CREATE - Tạo công việc mới
    // ============================================================
    /**
     * Tạo công việc mới
     * - Tự động sinh ma_cong_viec: CV-{Timestamp}
     * - Trạng thái mặc định: MOI_TAO (0)
     * - Validate ngày hẹn >= hiện tại
     */
    async create(
        dto: CreateCongViecDto,
        userId: string,
        tenantId: string,
    ) {
        // Validate ngày hẹn (phải >= hiện tại)
        if (dto.ngay_hen) {
            const ngayHen = new Date(dto.ngay_hen);
            const now = new Date();
            // So sánh chỉ ngày, không tính giờ
            now.setHours(0, 0, 0, 0);
            ngayHen.setHours(0, 0, 0, 0);

            if (ngayHen < now) {
                throw new BadRequestException('Ngày hẹn phải từ hôm nay trở đi');
            }
        }

        // Validate khách hàng tồn tại (nếu có)
        if (dto.id_khach_hang) {
            const khachHang = await this.prisma.khachHang.findFirst({
                where: {
                    id: dto.id_khach_hang,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
            });
            if (!khachHang) {
                throw new NotFoundException('Khách hàng không tồn tại');
            }
        }

        // Generate mã công việc: CV-{Timestamp}
        const maCongViec = `CV-${Date.now()}`;

        const congViec = await this.prisma.congViec.create({
            data: {
                id: uuidv4(),
                id_doanh_nghiep: tenantId,
                ma_cong_viec: maCongViec,
                tieu_de: dto.tieu_de,
                mo_ta: dto.mo_ta,
                id_khach_hang: dto.id_khach_hang,
                ngay_hen: dto.ngay_hen ? new Date(dto.ngay_hen) : null,
                dia_chi_lam_viec: dto.dia_chi_lam_viec,
                toa_do_lat: dto.toa_do_lat,
                toa_do_lng: dto.toa_do_lng,
                do_uu_tien: dto.do_uu_tien ?? 2,
                thoi_gian_du_kien: dto.thoi_gian_du_kien,
                ghi_chu_noi_bo: dto.ghi_chu_noi_bo,
                trang_thai: TrangThaiCongViec.MOI_TAO, // Mặc định 0
                nguoi_tao_id: userId,
            },
            include: {
                khach_hang: {
                    select: {
                        id: true,
                        ho_ten: true,
                        so_dien_thoai: true,
                        dia_chi: true,
                    },
                },
            },
        });

        return congViec;
    }

    // ============================================================
    // FIND ALL - Danh sách với filter & pagination
    // ============================================================
    async findAll(query: QueryCongViecDto, tenantId: string) {
        const {
            page = 1,
            limit = 20,
            trang_thai,
            id_khach_hang,
            tu_ngay,
            den_ngay,
            do_uu_tien,
            search,
            include_deleted,
        } = query;

        const skip = (page - 1) * limit;

        // Build where conditions
        const where: Prisma.CongViecWhereInput = {
            id_doanh_nghiep: tenantId,
        };

        // Soft delete filter
        if (!include_deleted) {
            where.ngay_xoa = null;
        }

        // Filter by status
        if (trang_thai !== undefined) {
            where.trang_thai = trang_thai;
        }

        // Filter by customer
        if (id_khach_hang) {
            where.id_khach_hang = id_khach_hang;
        }

        // Filter by priority
        if (do_uu_tien !== undefined) {
            where.do_uu_tien = do_uu_tien;
        }

        // Filter by date range (ngay_hen)
        if (tu_ngay || den_ngay) {
            where.ngay_hen = {};
            if (tu_ngay) {
                where.ngay_hen.gte = new Date(tu_ngay);
            }
            if (den_ngay) {
                where.ngay_hen.lte = new Date(den_ngay);
            }
        }

        // Search by title or job code
        if (search) {
            where.OR = [
                { tieu_de: { contains: search } },
                { ma_cong_viec: { contains: search } },
            ];
        }

        // Execute query
        const [data, total] = await Promise.all([
            this.prisma.congViec.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { do_uu_tien: 'desc' }, // Ưu tiên cao trước
                    { ngay_hen: 'asc' },    // Gần hẹn trước
                    { ngay_tao: 'desc' },
                ],
                include: {
                    khach_hang: {
                        select: {
                            id: true,
                            ho_ten: true,
                            so_dien_thoai: true,
                            dia_chi: true,
                        },
                    },
                    phan_cong: {
                        where: { ngay_xoa: null },
                        include: {
                            nguoi_dung: {
                                select: {
                                    id: true,
                                    ho_ten: true,
                                    so_dien_thoai: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            nghiem_thu_hinh_anh: true,
                        },
                    },
                },
            }),
            this.prisma.congViec.count({ where }),
        ]);

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

    // ============================================================
    // FIND ONE - Chi tiết công việc
    // ============================================================
    async findOne(id: string, tenantId: string) {
        const congViec = await this.prisma.congViec.findFirst({
            where: {
                id,
                id_doanh_nghiep: tenantId,
            },
            include: {
                khach_hang: true,
                phan_cong: {
                    where: { ngay_xoa: null },
                    include: {
                        nguoi_dung: {
                            select: {
                                id: true,
                                ho_ten: true,
                                so_dien_thoai: true,
                                anh_dai_dien: true,
                                vai_tro: true,
                            },
                        },
                    },
                },
                nghiem_thu_hinh_anh: {
                    where: { ngay_xoa: null },
                    orderBy: { ngay_tao: 'asc' },
                },
            },
        });

        if (!congViec) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        return congViec;
    }

    // ============================================================
    // UPDATE - Cập nhật thông tin công việc
    // ============================================================
    async update(id: string, dto: UpdateCongViecDto, userId: string, tenantId: string) {
        // Kiểm tra công việc tồn tại
        const existing = await this.prisma.congViec.findFirst({
            where: {
                id,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!existing) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        // Validate ngày hẹn nếu update
        if (dto.ngay_hen) {
            const ngayHen = new Date(dto.ngay_hen);
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            ngayHen.setHours(0, 0, 0, 0);

            if (ngayHen < now) {
                throw new BadRequestException('Ngày hẹn phải từ hôm nay trở đi');
            }
        }

        // Validate khách hàng nếu update
        if (dto.id_khach_hang) {
            const khachHang = await this.prisma.khachHang.findFirst({
                where: {
                    id: dto.id_khach_hang,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
            });
            if (!khachHang) {
                throw new NotFoundException('Khách hàng không tồn tại');
            }
        }

        return this.prisma.congViec.update({
            where: { id },
            data: {
                ...dto,
                ngay_hen: dto.ngay_hen ? new Date(dto.ngay_hen) : undefined,
                nguoi_cap_nhat_id: userId,
            },
            include: {
                khach_hang: {
                    select: {
                        id: true,
                        ho_ten: true,
                        so_dien_thoai: true,
                    },
                },
            },
        });
    }

    // ============================================================
    // UPDATE STATUS - Chuyển trạng thái workflow
    // ============================================================
    /**
     * Chuyển trạng thái công việc
     * - MOI_TAO (0) -> DANG_THUC_HIEN (1) -> HOAN_THANH (2)
     * - Có thể HUY (3) từ bất kỳ trạng thái nào
     * - Khi HOAN_THANH: Tự động set ngay_hoan_thanh = now()
     */
    async updateStatus(
        id: string,
        newStatus: TrangThaiCongViec,
        userId: string,
        tenantId: string,
    ) {
        const congViec = await this.prisma.congViec.findFirst({
            where: {
                id,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!congViec) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        const currentStatus = congViec.trang_thai;

        // Validate state transition
        const validTransitions: Record<number, number[]> = {
            [TrangThaiCongViec.MOI_TAO]: [TrangThaiCongViec.DANG_THUC_HIEN, TrangThaiCongViec.HUY],
            [TrangThaiCongViec.DANG_THUC_HIEN]: [TrangThaiCongViec.HOAN_THANH, TrangThaiCongViec.HUY],
            [TrangThaiCongViec.HOAN_THANH]: [], // Không thể chuyển tiếp
            [TrangThaiCongViec.HUY]: [], // Không thể chuyển tiếp
        };

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
            throw new BadRequestException(
                `Không thể chuyển từ trạng thái ${currentStatus} sang ${newStatus}`,
            );
        }

        // Build update data
        const updateData: Prisma.CongViecUpdateInput = {
            trang_thai: newStatus,
            nguoi_cap_nhat_id: userId,
        };

        // Auto-set ngay_hoan_thanh when completing
        if (newStatus === TrangThaiCongViec.HOAN_THANH) {
            updateData.ngay_hoan_thanh = new Date();
        }

        return this.prisma.congViec.update({
            where: { id },
            data: updateData,
            include: {
                khach_hang: {
                    select: {
                        id: true,
                        ho_ten: true,
                    },
                },
                phan_cong: {
                    include: {
                        nguoi_dung: {
                            select: {
                                id: true,
                                ho_ten: true,
                            },
                        },
                    },
                },
            },
        });
    }

    // ============================================================
    // GET MY JOBS - API cho Mobile App
    // ============================================================
    /**
     * Lấy danh sách công việc được phân công cho user đang login
     * - Tìm trong bảng PhanCong where id_nguoi_dung = currentUser.id
     * - Include thông tin công việc và khách hàng
     * - Chỉ lấy công việc chưa hoàn thành/chưa hủy
     */
    async getMyJobs(
        userId: string,
        tenantId: string,
        options?: {
            page?: number;
            limit?: number;
            trang_thai?: TrangThaiCongViec;
            tu_ngay?: string;
            den_ngay?: string;
        },
    ) {
        const page = options?.page || 1;
        const limit = options?.limit || 20;
        const skip = (page - 1) * limit;

        // Build where for CongViec through PhanCong
        const phanCongWhere: Prisma.PhanCongWhereInput = {
            id_nguoi_dung: userId,
            id_doanh_nghiep: tenantId,
            ngay_xoa: null,
            cong_viec: {
                ngay_xoa: null,
            },
        };

        // Filter by job status
        if (options?.trang_thai !== undefined) {
            phanCongWhere.cong_viec = {
                ...phanCongWhere.cong_viec as object,
                trang_thai: options.trang_thai,
            };
        }

        // Filter by date range
        if (options?.tu_ngay || options?.den_ngay) {
            const ngayHenFilter: any = {};
            if (options.tu_ngay) {
                ngayHenFilter.gte = new Date(options.tu_ngay);
            }
            if (options.den_ngay) {
                ngayHenFilter.lte = new Date(options.den_ngay);
            }
            phanCongWhere.cong_viec = {
                ...phanCongWhere.cong_viec as object,
                ngay_hen: ngayHenFilter,
            };
        }

        const [phanCongList, total] = await Promise.all([
            this.prisma.phanCong.findMany({
                where: phanCongWhere,
                skip,
                take: limit,
                orderBy: {
                    cong_viec: {
                        ngay_hen: 'asc',
                    },
                },
                include: {
                    cong_viec: {
                        include: {
                            khach_hang: {
                                select: {
                                    id: true,
                                    ho_ten: true,
                                    so_dien_thoai: true,
                                    dia_chi: true,
                                },
                            },
                            phan_cong: {
                                where: { ngay_xoa: null },
                                include: {
                                    nguoi_dung: {
                                        select: {
                                            id: true,
                                            ho_ten: true,
                                        },
                                    },
                                },
                            },
                            _count: {
                                select: {
                                    nghiem_thu_hinh_anh: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.phanCong.count({ where: phanCongWhere }),
        ]);

        // Transform data - extract cong_viec with assignment info
        const data = phanCongList.map((pc) => ({
            ...pc.cong_viec,
            my_assignment: {
                id: pc.id,
                la_truong_nhom: pc.la_truong_nhom === 1,
                trang_thai: pc.trang_thai,
                ghi_chu: pc.ghi_chu,
            },
        }));

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

    // ============================================================
    // REMOVE - Soft delete
    // ============================================================
    async remove(id: string, userId: string, tenantId: string) {
        const congViec = await this.prisma.congViec.findFirst({
            where: {
                id,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!congViec) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        return this.prisma.congViec.update({
            where: { id },
            data: {
                ngay_xoa: new Date(),
                nguoi_cap_nhat_id: userId,
            },
        });
    }

    // ============================================================
    // RESTORE - Khôi phục công việc đã xóa
    // ============================================================
    async restore(id: string, userId: string, tenantId: string) {
        const congViec = await this.prisma.congViec.findFirst({
            where: {
                id,
                id_doanh_nghiep: tenantId,
                ngay_xoa: { not: null },
            },
        });

        if (!congViec) {
            throw new NotFoundException('Không tìm thấy công việc đã xóa');
        }

        return this.prisma.congViec.update({
            where: { id },
            data: {
                ngay_xoa: null,
                nguoi_cap_nhat_id: userId,
            },
        });
    }

    // ============================================================
    // COUNT - Đếm số công việc
    // ============================================================
    async count(tenantId: string): Promise<number> {
        return this.prisma.congViec.count({
            where: {
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });
    }

    // ============================================================
    // STATS - Thống kê công việc
    // ============================================================
    async getStats(tenantId: string) {
        const [byStatus, byPriority, total] = await Promise.all([
            // Group by status
            this.prisma.congViec.groupBy({
                by: ['trang_thai'],
                where: {
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
                _count: true,
            }),
            // Group by priority
            this.prisma.congViec.groupBy({
                by: ['do_uu_tien'],
                where: {
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
                _count: true,
            }),
            // Total count
            this.prisma.congViec.count({
                where: {
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
            }),
        ]);

        return {
            total,
            by_status: byStatus.reduce(
                (acc, item) => {
                    acc[item.trang_thai] = item._count;
                    return acc;
                },
                {} as Record<number, number>,
            ),
            by_priority: byPriority.reduce(
                (acc, item) => {
                    acc[item.do_uu_tien] = item._count;
                    return acc;
                },
                {} as Record<number, number>,
            ),
        };
    }
}
