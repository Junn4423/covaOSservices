/**
 * ============================================================
 * NHÀ CUNG CẤP SERVICE - ProcurePool Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * SUPPLIER MANAGEMENT:
 * - CRUD operations with soft delete
 * - Search & Filter
 * - Multi-tenant support
 *
 * Phase 10: ProcurePool - Procurement Management
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import {
    CreateNhaCungCapDto,
    UpdateNhaCungCapDto,
    QueryNhaCungCapDto,
} from '../dto/nha-cung-cap.dto';

@Injectable()
export class NhaCungCapService {
    private readonly logger = new Logger(NhaCungCapService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Sinh mã NCC tự động
     */
    private async generateMaNCC(idDoanhNghiep: string): Promise<string> {
        const count = await this.prisma.nhaCungCap.count({
            where: { id_doanh_nghiep: idDoanhNghiep },
        });
        return `NCC-${String(count + 1).padStart(4, '0')}`;
    }

    // ============================================================
    // CREATE
    // ============================================================

    /**
     * Tạo nhà cung cấp mới
     */
    async create(
        idDoanhNghiep: string,
        dto: CreateNhaCungCapDto,
        nguoiTaoId?: string,
    ) {
        // Sinh mã NCC nếu không có
        const maNcc = dto.ma_ncc || (await this.generateMaNCC(idDoanhNghiep));

        // Kiểm tra mã NCC đã tồn tại chưa
        if (dto.ma_ncc) {
            const existing = await this.prisma.nhaCungCap.findFirst({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    ma_ncc: dto.ma_ncc,
                    ngay_xoa: null,
                },
            });
            if (existing) {
                throw new BadRequestException(
                    `Mã nhà cung cấp "${dto.ma_ncc}" đã tồn tại`,
                );
            }
        }

        const nhaCungCap = await this.prisma.nhaCungCap.create({
            data: {
                id: uuidv4(),
                id_doanh_nghiep: idDoanhNghiep,
                ma_ncc: maNcc,
                ten_nha_cung_cap: dto.ten_nha_cung_cap,
                nguoi_lien_he: dto.nguoi_lien_he,
                email: dto.email,
                so_dien_thoai: dto.so_dien_thoai,
                dia_chi: dto.dia_chi,
                ma_so_thue: dto.ma_so_thue,
                so_tai_khoan: dto.so_tai_khoan,
                ngan_hang: dto.ngan_hang,
                ghi_chu: dto.ghi_chu,
                trang_thai: 1,
                nguoi_tao_id: nguoiTaoId,
            },
        });

        this.logger.log(
            `🏭 Tạo NCC: ${maNcc} - ${dto.ten_nha_cung_cap} (DN: ${idDoanhNghiep})`,
        );

        return nhaCungCap;
    }

    // ============================================================
    // READ
    // ============================================================

    /**
     * Lấy danh sách nhà cung cấp có phân trang & filter
     */
    async findAll(idDoanhNghiep: string, query: QueryNhaCungCapDto) {
        const {
            page = 1,
            limit = 10,
            search,
            trang_thai,
            sortBy = 'ngay_tao',
            sortOrder = 'desc',
        } = query;

        // Build where clause
        const where: any = {
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        // Search filter
        if (search) {
            where.OR = [
                { ten_nha_cung_cap: { contains: search } },
                { ma_ncc: { contains: search } },
                { email: { contains: search } },
                { so_dien_thoai: { contains: search } },
            ];
        }

        // Status filter
        if (trang_thai !== undefined) {
            where.trang_thai = trang_thai;
        }

        // Count total
        const total = await this.prisma.nhaCungCap.count({ where });

        // Get data with pagination
        const data = await this.prisma.nhaCungCap.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        });

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
     * Lấy chi tiết nhà cung cấp theo ID
     */
    async findOne(idDoanhNghiep: string, id: string) {
        const nhaCungCap = await this.prisma.nhaCungCap.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: {
                _count: {
                    select: {
                        don_dat_hang_ncc: true,
                    },
                },
            },
        });

        if (!nhaCungCap) {
            throw new NotFoundException(`Không tìm thấy nhà cung cấp với ID: ${id}`);
        }

        return nhaCungCap;
    }

    /**
     * Lấy tất cả NCC đang hoạt động (không phân trang - cho dropdown)
     */
    async getAllActive(idDoanhNghiep: string) {
        return this.prisma.nhaCungCap.findMany({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                trang_thai: 1,
                ngay_xoa: null,
            },
            select: {
                id: true,
                ma_ncc: true,
                ten_nha_cung_cap: true,
                so_dien_thoai: true,
                email: true,
            },
            orderBy: { ten_nha_cung_cap: 'asc' },
        });
    }

    // ============================================================
    // UPDATE
    // ============================================================

    /**
     * Cập nhật nhà cung cấp
     */
    async update(
        idDoanhNghiep: string,
        id: string,
        dto: UpdateNhaCungCapDto,
        nguoiCapNhatId?: string,
    ) {
        // Kiểm tra tồn tại
        const existing = await this.prisma.nhaCungCap.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Không tìm thấy nhà cung cấp với ID: ${id}`);
        }

        // Kiểm tra mã NCC mới không trùng
        if (dto.ma_ncc && dto.ma_ncc !== existing.ma_ncc) {
            const duplicateMa = await this.prisma.nhaCungCap.findFirst({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    ma_ncc: dto.ma_ncc,
                    id: { not: id },
                    ngay_xoa: null,
                },
            });
            if (duplicateMa) {
                throw new BadRequestException(
                    `Mã nhà cung cấp "${dto.ma_ncc}" đã tồn tại`,
                );
            }
        }

        const updated = await this.prisma.nhaCungCap.update({
            where: { id },
            data: {
                ...dto,
                nguoi_cap_nhat_id: nguoiCapNhatId,
            },
        });

        this.logger.log(`✏️ Cập nhật NCC: ${id} (DN: ${idDoanhNghiep})`);

        return updated;
    }

    // ============================================================
    // DELETE (SOFT)
    // ============================================================

    /**
     * Xóa mềm nhà cung cấp
     */
    async remove(idDoanhNghiep: string, id: string, nguoiXoaId?: string) {
        // Kiểm tra tồn tại
        const existing = await this.prisma.nhaCungCap.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: {
                _count: {
                    select: {
                        don_dat_hang_ncc: {
                            where: {
                                ngay_xoa: null,
                                trang_thai: { in: [0, 1] }, // DRAFT, ORDERED
                            },
                        },
                    },
                },
            },
        });

        if (!existing) {
            throw new NotFoundException(`Không tìm thấy nhà cung cấp với ID: ${id}`);
        }

        // Kiểm tra còn đơn hàng pending không
        if (existing._count.don_dat_hang_ncc > 0) {
            throw new BadRequestException(
                `Không thể xóa NCC vì còn ${existing._count.don_dat_hang_ncc} đơn hàng đang xử lý`,
            );
        }

        await this.prisma.nhaCungCap.update({
            where: { id },
            data: {
                ngay_xoa: new Date(),
                nguoi_cap_nhat_id: nguoiXoaId,
            },
        });

        this.logger.log(`🗑️ Xóa NCC: ${id} (DN: ${idDoanhNghiep})`);

        return { message: 'Xóa nhà cung cấp thành công' };
    }

    /**
     * Khôi phục nhà cung cấp đã xóa
     */
    async restore(idDoanhNghiep: string, id: string, nguoiKhoiPhucId?: string) {
        const existing = await this.prisma.nhaCungCap.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: { not: null },
            },
        });

        if (!existing) {
            throw new NotFoundException(
                `Không tìm thấy nhà cung cấp đã xóa với ID: ${id}`,
            );
        }

        await this.prisma.nhaCungCap.update({
            where: { id },
            data: {
                ngay_xoa: null,
                nguoi_cap_nhat_id: nguoiKhoiPhucId,
            },
        });

        this.logger.log(`♻️ Khôi phục NCC: ${id} (DN: ${idDoanhNghiep})`);

        return { message: 'Khôi phục nhà cung cấp thành công' };
    }

    // ============================================================
    // STATISTICS
    // ============================================================

    /**
     * Thống kê số lượng NCC
     */
    async count(idDoanhNghiep: string) {
        const [total, active, inactive] = await Promise.all([
            this.prisma.nhaCungCap.count({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                },
            }),
            this.prisma.nhaCungCap.count({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    trang_thai: 1,
                    ngay_xoa: null,
                },
            }),
            this.prisma.nhaCungCap.count({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    trang_thai: 0,
                    ngay_xoa: null,
                },
            }),
        ]);

        return {
            tong: total,
            hoat_dong: active,
            ngung_hoat_dong: inactive,
        };
    }
}
