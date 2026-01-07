/**
 * ============================================================
 * SẢN PHẨM SERVICE - StockPile Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  XỬ LÝ DECIMAL:
 * Prisma trả về Prisma.Decimal object. Service này sẽ convert
 * sang number trước khi trả về cho Frontend.
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
    CreateSanPhamDto,
    UpdateSanPhamDto,
    QuerySanPhamDto,
    decimalToNumber,
} from '../dto/san-pham.dto';

@Injectable()
export class SanPhamService {
    private readonly logger = new Logger(SanPhamService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Transform sản phẩm để convert Decimal fields sang number
     */
    private transformProduct(product: any) {
        if (!product) return product;

        return {
            ...product,
            gia_ban: decimalToNumber(product.gia_ban),
            gia_von: decimalToNumber(product.gia_von),
            nhom_san_pham: product.nhom_san_pham
                ? {
                    id: product.nhom_san_pham.id,
                    ten_nhom: product.nhom_san_pham.ten_nhom,
                }
                : null,
        };
    }

    /**
     * Transform danh sách sản phẩm
     */
    private transformProducts(products: any[]) {
        return products.map((p) => this.transformProduct(p));
    }

    /**
     * Tạo sản phẩm mới
     */
    async create(dto: CreateSanPhamDto) {
        // Auto-generate mã sản phẩm nếu không có
        const maSanPham = dto.ma_san_pham || `SP-${Date.now()}`;

        // Kiểm tra mã SP đã tồn tại chưa (trong cùng tenant)
        const existing = await this.prisma.sanPham.findFirst({
            where: { ma_san_pham: maSanPham },
        });

        if (existing) {
            throw new ConflictException(
                `Mã sản phẩm "${maSanPham}" đã tồn tại trong hệ thống`,
            );
        }

        // Validate nhóm sản phẩm nếu có
        if (dto.id_nhom_san_pham) {
            const nhom = await this.prisma.nhomSanPham.findFirst({
                where: { id: dto.id_nhom_san_pham },
            });
            if (!nhom) {
                throw new NotFoundException(
                    `Không tìm thấy nhóm sản phẩm với ID: ${dto.id_nhom_san_pham}`,
                );
            }
        }

        const sanPham = await this.prisma.sanPham.create({
            data: {
                id: uuidv4(),
                ma_san_pham: maSanPham,
                ten_san_pham: dto.ten_san_pham,
                loai_san_pham: dto.loai_san_pham,
                gia_ban: dto.gia_ban ?? 0,
                gia_von: dto.gia_von ?? 0,
                don_vi_tinh: dto.don_vi_tinh,
                hinh_anh: dto.hinh_anh,
                mo_ta: dto.mo_ta,
                id_nhom_san_pham: dto.id_nhom_san_pham,
            } as any,
            include: {
                nhom_san_pham: {
                    select: { id: true, ten_nhom: true },
                },
            },
        });

        this.logger.log(`Tạo sản phẩm: ${sanPham.id} - ${sanPham.ten_san_pham}`);
        return this.transformProduct(sanPham);
    }

    /**
     * Lấy danh sách sản phẩm có phân trang + filter
     */
    async findAll(query: QuerySanPhamDto) {
        const {
            page = 1,
            limit = 20,
            search,
            id_nhom_san_pham,
            loai_san_pham,
        } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: any = {};

        // Search by name or code
        if (search) {
            where.OR = [
                { ten_san_pham: { contains: search } },
                { ma_san_pham: { contains: search } },
                { mo_ta: { contains: search } },
            ];
        }

        // Filter by category
        if (id_nhom_san_pham) {
            where.id_nhom_san_pham = id_nhom_san_pham;
        }

        // Filter by product type
        if (loai_san_pham) {
            where.loai_san_pham = loai_san_pham;
        }

        const [data, total] = await Promise.all([
            this.prisma.sanPham.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
                include: {
                    nhom_san_pham: {
                        select: { id: true, ten_nhom: true },
                    },
                },
            }),
            this.prisma.sanPham.count({ where }),
        ]);

        return {
            data: this.transformProducts(data),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy chi tiết sản phẩm
     */
    async findOne(id: string) {
        const sanPham = await this.prisma.sanPham.findFirst({
            where: { id },
            include: {
                nhom_san_pham: {
                    select: { id: true, ten_nhom: true },
                },
            },
        });

        if (!sanPham) {
            throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
        }

        return this.transformProduct(sanPham);
    }

    /**
     * Tìm theo mã sản phẩm
     */
    async findByMaSanPham(maSanPham: string) {
        const sanPham = await this.prisma.sanPham.findFirst({
            where: { ma_san_pham: maSanPham },
            include: {
                nhom_san_pham: {
                    select: { id: true, ten_nhom: true },
                },
            },
        });

        if (!sanPham) {
            throw new NotFoundException(
                `Không tìm thấy sản phẩm với mã: ${maSanPham}`,
            );
        }

        return this.transformProduct(sanPham);
    }

    /**
     * Cập nhật sản phẩm
     */
    async update(id: string, dto: UpdateSanPhamDto) {
        // Kiểm tra tồn tại
        await this.findOne(id);

        // Kiểm tra mã SP trùng nếu update
        if (dto.ma_san_pham) {
            const existing = await this.prisma.sanPham.findFirst({
                where: {
                    ma_san_pham: dto.ma_san_pham,
                    id: { not: id },
                },
            });

            if (existing) {
                throw new ConflictException(
                    `Mã sản phẩm "${dto.ma_san_pham}" đã được sử dụng`,
                );
            }
        }

        // Validate nhóm sản phẩm nếu update
        if (dto.id_nhom_san_pham) {
            const nhom = await this.prisma.nhomSanPham.findFirst({
                where: { id: dto.id_nhom_san_pham },
            });
            if (!nhom) {
                throw new NotFoundException(
                    `Không tìm thấy nhóm sản phẩm với ID: ${dto.id_nhom_san_pham}`,
                );
            }
        }

        const sanPham = await this.prisma.sanPham.update({
            where: { id },
            data: {
                ...(dto.ma_san_pham && { ma_san_pham: dto.ma_san_pham }),
                ...(dto.ten_san_pham && { ten_san_pham: dto.ten_san_pham }),
                ...(dto.loai_san_pham && { loai_san_pham: dto.loai_san_pham }),
                ...(dto.gia_ban !== undefined && { gia_ban: dto.gia_ban }),
                ...(dto.gia_von !== undefined && { gia_von: dto.gia_von }),
                ...(dto.don_vi_tinh !== undefined && { don_vi_tinh: dto.don_vi_tinh }),
                ...(dto.hinh_anh !== undefined && { hinh_anh: dto.hinh_anh }),
                ...(dto.mo_ta !== undefined && { mo_ta: dto.mo_ta }),
                ...(dto.id_nhom_san_pham !== undefined && {
                    id_nhom_san_pham: dto.id_nhom_san_pham || null,
                }),
            },
            include: {
                nhom_san_pham: {
                    select: { id: true, ten_nhom: true },
                },
            },
        });

        this.logger.log(`Cập nhật sản phẩm: ${id}`);
        return this.transformProduct(sanPham);
    }

    /**
     * Xóa mềm sản phẩm
     */
    async remove(id: string) {
        await this.findOne(id);

        // Soft delete - CLS Middleware sẽ convert
        const sanPham = await this.prisma.sanPham.delete({
            where: { id },
        });

        this.logger.log(`Xóa sản phẩm: ${id}`);
        return this.transformProduct(sanPham);
    }

    /**
     * Đếm số sản phẩm
     */
    async count() {
        return this.prisma.sanPham.count({});
    }

    /**
     * Thống kê theo loại sản phẩm
     */
    async getStatsByLoaiSanPham() {
        const stats = await (this.prisma.sanPham.groupBy as any)({
            by: ['loai_san_pham'],
            _count: { id: true },
        });

        return stats.map((s: any) => ({
            loai_san_pham: s.loai_san_pham,
            count: s._count?.id || 0,
        }));
    }

    /**
     * Thống kê theo nhóm sản phẩm
     */
    async getStatsByNhomSanPham() {
        const stats = await (this.prisma.sanPham.groupBy as any)({
            by: ['id_nhom_san_pham'],
            _count: { id: true },
        });

        // Lấy thêm thông tin tên nhóm
        const nhomIds = stats
            .map((s: any) => s.id_nhom_san_pham)
            .filter((id: any) => id);

        const nhoms = await this.prisma.nhomSanPham.findMany({
            where: { id: { in: nhomIds } },
            select: { id: true, ten_nhom: true },
        });

        const nhomMap = new Map(nhoms.map((n) => [n.id, n.ten_nhom]));

        return stats.map((s: any) => ({
            id_nhom_san_pham: s.id_nhom_san_pham,
            ten_nhom: s.id_nhom_san_pham
                ? nhomMap.get(s.id_nhom_san_pham) || 'Unknown'
                : 'Chưa phân loại',
            count: s._count?.id || 0,
        }));
    }
}
