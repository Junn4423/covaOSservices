/**
 * ============================================================
 * KHO SERVICE - StockPile Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  WAREHOUSE MANAGEMENT:
 * - CRUD cơ bản cho kho (Multi-tenant support)
 * - Soft delete support
 * - Validate người phụ trách
 *
 * Phase 9: StockPile Advanced - Warehouse & Inventory
 */

import {
    Injectable,
    NotFoundException,
    ConflictException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import { CreateKhoDto, UpdateKhoDto, QueryKhoDto } from '../dto/kho.dto';

@Injectable()
export class KhoService {
    private readonly logger = new Logger(KhoService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Include relations cho query
     */
    private readonly includeRelations = {
        nguoi_phu_trach: {
            select: {
                id: true,
                ho_ten: true,
                email: true,
            },
        },
    };

    /**
     * Transform kho response
     */
    private transformKho(kho: any) {
        if (!kho) return kho;
        return {
            ...kho,
            nguoi_phu_trach: kho.nguoi_phu_trach || null,
        };
    }

    /**
     * Transform danh sách kho
     */
    private transformKhoList(khoList: any[]) {
        return khoList.map((k) => this.transformKho(k));
    }

    // ============================================================
    //  CREATE - Tạo kho mới
    // ============================================================
    /**
     * Tạo kho mới
     * @param idDoanhNghiep - ID doanh nghiệp (multi-tenant)
     * @param dto - CreateKhoDto
     * @param nguoiTaoId - ID người tạo (optional)
     */
    async create(idDoanhNghiep: string, dto: CreateKhoDto, nguoiTaoId?: string) {
        const { ten_kho, loai_kho = 'co_dinh', dia_chi, id_nguoi_phu_trach } = dto;

        // Validate người phụ trách nếu có (phải thuộc cùng doanh nghiệp)
        if (id_nguoi_phu_trach) {
            const nguoiDung = await this.prisma.nguoiDung.findFirst({
                where: {
                    id: id_nguoi_phu_trach,
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                },
            });
            if (!nguoiDung) {
                throw new NotFoundException(
                    `Không tìm thấy người dùng với ID: ${id_nguoi_phu_trach}`,
                );
            }
        }

        const khoId = uuidv4();
        const kho = await this.prisma.kho.create({
            data: {
                id: khoId,
                id_doanh_nghiep: idDoanhNghiep,
                ten_kho,
                loai_kho: loai_kho as any,
                dia_chi,
                id_nguoi_phu_trach,
                trang_thai: 1,
                nguoi_tao_id: nguoiTaoId,
            } as any,
            include: this.includeRelations,
        });

        this.logger.log(`Tạo kho: ${kho.id} - ${kho.ten_kho} (DN: ${idDoanhNghiep})`);
        return this.transformKho(kho);
    }

    // ============================================================
    //  FIND ALL - Danh sách kho có phân trang
    // ============================================================
    async findAll(idDoanhNghiep: string, query: QueryKhoDto) {
        const { page = 1, limit = 20, search, loai_kho } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: any = {
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        // Search by name
        if (search) {
            where.OR = [
                { ten_kho: { contains: search } },
                { dia_chi: { contains: search } },
            ];
        }

        // Filter by loai_kho
        if (loai_kho) {
            where.loai_kho = loai_kho;
        }

        const [data, total] = await Promise.all([
            this.prisma.kho.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
                include: this.includeRelations,
            }),
            this.prisma.kho.count({ where }),
        ]);

        return {
            data: this.transformKhoList(data),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    //  FIND ONE - Chi tiết kho
    // ============================================================
    async findOne(idDoanhNghiep: string, id: string) {
        const kho = await this.prisma.kho.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: this.includeRelations,
        });

        if (!kho) {
            throw new NotFoundException(`Không tìm thấy kho với ID: ${id}`);
        }

        return this.transformKho(kho);
    }

    // ============================================================
    //  UPDATE - Cập nhật kho
    // ============================================================
    async update(idDoanhNghiep: string, id: string, dto: UpdateKhoDto, nguoiCapNhatId?: string) {
        // Kiểm tra kho tồn tại
        await this.findOne(idDoanhNghiep, id);

        // Validate người phụ trách nếu cập nhật (phải thuộc cùng doanh nghiệp)
        if (dto.id_nguoi_phu_trach) {
            const nguoiDung = await this.prisma.nguoiDung.findFirst({
                where: {
                    id: dto.id_nguoi_phu_trach,
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                },
            });
            if (!nguoiDung) {
                throw new NotFoundException(
                    `Không tìm thấy người dùng với ID: ${dto.id_nguoi_phu_trach}`,
                );
            }
        }

        // Build update data
        const updateData: any = {
            nguoi_cap_nhat_id: nguoiCapNhatId,
        };
        if (dto.ten_kho !== undefined) updateData.ten_kho = dto.ten_kho;
        if (dto.loai_kho !== undefined) updateData.loai_kho = dto.loai_kho;
        if (dto.dia_chi !== undefined) updateData.dia_chi = dto.dia_chi;
        if (dto.id_nguoi_phu_trach !== undefined) {
            updateData.id_nguoi_phu_trach = dto.id_nguoi_phu_trach || null;
        }

        const updated = await this.prisma.kho.update({
            where: { id },
            data: updateData,
            include: this.includeRelations,
        });

        this.logger.log(`Cập nhật kho: ${id} - ${updated.ten_kho}`);
        return this.transformKho(updated);
    }

    // ============================================================
    //  REMOVE - Xóa mềm kho
    // ============================================================
    async remove(idDoanhNghiep: string, id: string, nguoiCapNhatId?: string) {
        const kho = await this.findOne(idDoanhNghiep, id);

        // Kiểm tra xem kho có tồn kho không
        const tonKhoCount = await this.prisma.tonKho.count({
            where: {
                id_kho: id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
                so_luong: { gt: 0 },
            },
        });

        if (tonKhoCount > 0) {
            throw new BadRequestException(
                `Không thể xóa kho "${kho.ten_kho}" vì vẫn còn ${tonKhoCount} sản phẩm tồn kho`,
            );
        }

        // Soft delete
        const deleted = await this.prisma.kho.update({
            where: { id },
            data: {
                ngay_xoa: new Date(),
                nguoi_cap_nhat_id: nguoiCapNhatId,
            },
            include: this.includeRelations,
        });

        this.logger.log(`Xóa kho: ${id} - ${kho.ten_kho}`);
        return this.transformKho(deleted);
    }

    // ============================================================
    //  COUNT - Đếm tổng số kho
    // ============================================================
    async count(idDoanhNghiep: string) {
        return this.prisma.kho.count({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });
    }

    // ============================================================
    //  RESTORE - Khôi phục kho đã xóa
    // ============================================================
    async restore(idDoanhNghiep: string, id: string, nguoiCapNhatId?: string) {
        const kho = await this.prisma.kho.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: { not: null },
            },
        });

        if (!kho) {
            throw new NotFoundException(`Không tìm thấy kho đã xóa với ID: ${id}`);
        }

        const restored = await this.prisma.kho.update({
            where: { id },
            data: {
                ngay_xoa: null,
                nguoi_cap_nhat_id: nguoiCapNhatId,
            },
            include: this.includeRelations,
        });

        this.logger.log(`Khôi phục kho: ${id} - ${kho.ten_kho}`);
        return this.transformKho(restored);
    }

    // ============================================================
    //  GET ALL ACTIVE - Lấy tất cả kho đang hoạt động (không phân trang)
    // ============================================================
    /**
     * Dùng cho dropdown select
     */
    async getAllActive(idDoanhNghiep: string) {
        const data = await this.prisma.kho.findMany({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
                trang_thai: 1,
            },
            orderBy: { ten_kho: 'asc' },
            select: {
                id: true,
                ten_kho: true,
                loai_kho: true,
                dia_chi: true,
            },
        });

        return data;
    }
}
