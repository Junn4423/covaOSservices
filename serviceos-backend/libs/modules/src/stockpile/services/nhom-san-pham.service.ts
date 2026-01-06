/**
 * ============================================================
 * NHÓM SẢN PHẨM SERVICE - StockPile Module
 * ServiceOS - SaaS Backend
 * ============================================================
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
    CreateNhomSanPhamDto,
    UpdateNhomSanPhamDto,
    QueryNhomSanPhamDto,
} from '../dto/nhom-san-pham.dto';

@Injectable()
export class NhomSanPhamService {
    private readonly logger = new Logger(NhomSanPhamService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Tạo nhóm sản phẩm mới
     */
    async create(dto: CreateNhomSanPhamDto) {
        // Kiểm tra tên nhóm đã tồn tại chưa (trong cùng tenant)
        const existing = await this.prisma.nhomSanPham.findFirst({
            where: { ten_nhom: dto.ten_nhom },
        });

        if (existing) {
            throw new ConflictException(`Nhóm sản phẩm "${dto.ten_nhom}" đã tồn tại`);
        }

        const nhom = await this.prisma.nhomSanPham.create({
            data: {
                id: uuidv4(),
                ten_nhom: dto.ten_nhom,
                mo_ta: dto.mo_ta,
                thu_tu: dto.thu_tu ?? 0,
            } as any,
        });

        this.logger.log(`Tạo nhóm sản phẩm: ${nhom.id} - ${nhom.ten_nhom}`);
        return nhom;
    }

    /**
     * Lấy danh sách nhóm sản phẩm
     */
    async findAll(query: QueryNhomSanPhamDto) {
        const { page = 1, limit = 50, search } = query;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { ten_nhom: { contains: search } },
                { mo_ta: { contains: search } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.nhomSanPham.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { thu_tu: 'asc' },
                    { ten_nhom: 'asc' },
                ],
                include: {
                    _count: {
                        select: { san_pham: true },
                    },
                },
            }),
            this.prisma.nhomSanPham.count({ where }),
        ]);

        // Transform data để thêm so_san_pham
        const transformedData = data.map((item: any) => ({
            ...item,
            so_san_pham: item._count?.san_pham || 0,
            _count: undefined,
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

    /**
     * Lấy chi tiết nhóm sản phẩm
     */
    async findOne(id: string) {
        const nhom = await this.prisma.nhomSanPham.findFirst({
            where: { id },
            include: {
                _count: {
                    select: { san_pham: true },
                },
            },
        });

        if (!nhom) {
            throw new NotFoundException(`Không tìm thấy nhóm sản phẩm với ID: ${id}`);
        }

        return {
            ...nhom,
            so_san_pham: (nhom as any)._count?.san_pham || 0,
        };
    }

    /**
     * Cập nhật nhóm sản phẩm
     */
    async update(id: string, dto: UpdateNhomSanPhamDto) {
        await this.findOne(id);

        // Kiểm tra tên trùng nếu update tên
        if (dto.ten_nhom) {
            const existing = await this.prisma.nhomSanPham.findFirst({
                where: {
                    ten_nhom: dto.ten_nhom,
                    id: { not: id },
                },
            });

            if (existing) {
                throw new ConflictException(`Nhóm sản phẩm "${dto.ten_nhom}" đã tồn tại`);
            }
        }

        const nhom = await this.prisma.nhomSanPham.update({
            where: { id },
            data: {
                ...(dto.ten_nhom && { ten_nhom: dto.ten_nhom }),
                ...(dto.mo_ta !== undefined && { mo_ta: dto.mo_ta }),
                ...(dto.thu_tu !== undefined && { thu_tu: dto.thu_tu }),
            },
        });

        this.logger.log(`Cập nhật nhóm sản phẩm: ${id}`);
        return nhom;
    }

    /**
     * Xóa mềm nhóm sản phẩm
     */
    async remove(id: string) {
        await this.findOne(id);

        // Soft delete
        const nhom = await this.prisma.nhomSanPham.delete({
            where: { id },
        });

        this.logger.log(`Xóa nhóm sản phẩm: ${id}`);
        return nhom;
    }

    /**
     * Đếm số nhóm sản phẩm
     */
    async count() {
        return this.prisma.nhomSanPham.count({});
    }
}
