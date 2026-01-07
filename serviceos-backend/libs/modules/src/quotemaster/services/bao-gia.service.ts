/**
 * ============================================================
 * BÁO GIÁ SERVICE - QuoteMaster Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * 📌 XỬ LÝ DECIMAL:
 * Prisma trả về Prisma.Decimal object. Service này sẽ convert
 * sang number trước khi trả về cho Frontend.
 *
 * 📌 LOGIC TÍNH TOÁN TIỀN:
 * - thanh_tien (mỗi dòng) = so_luong * don_gia
 * - tong_tien_truoc_thue = SUM(thanh_tien)
 * - tien_thue = tong_tien_truoc_thue * thue_vat / 100
 * - tong_tien_sau_thue = tong_tien_truoc_thue + tien_thue
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import {
    CreateBaoGiaDto,
    QueryBaoGiaDto,
    UpdateBaoGiaStatusDto,
    decimalToNumberBaoGia,
    TrangThaiBaoGia,
} from '../dto/bao-gia.dto';

@Injectable()
export class BaoGiaService {
    private readonly logger = new Logger(BaoGiaService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Include relations cho query
     */
    private readonly includeRelations = {
        khach_hang: {
            select: {
                id: true,
                ho_ten: true,
                so_dien_thoai: true,
                email: true,
            },
        },
        chi_tiet: {
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
    };

    /**
     * Transform chi tiết báo giá để convert Decimal fields sang number
     */
    private transformChiTiet(chiTiet: any) {
        if (!chiTiet) return chiTiet;
        return {
            ...chiTiet,
            don_gia: decimalToNumberBaoGia(chiTiet.don_gia),
            thanh_tien: decimalToNumberBaoGia(chiTiet.thanh_tien),
        };
    }

    /**
     * Transform báo giá để convert Decimal fields sang number
     */
    private transformBaoGia(baoGia: any) {
        if (!baoGia) return baoGia;

        return {
            ...baoGia,
            tong_tien_truoc_thue: decimalToNumberBaoGia(baoGia.tong_tien_truoc_thue),
            thue_vat: decimalToNumberBaoGia(baoGia.thue_vat),
            tien_thue: decimalToNumberBaoGia(baoGia.tien_thue),
            tong_tien_sau_thue: decimalToNumberBaoGia(baoGia.tong_tien_sau_thue),
            chi_tiet: baoGia.chi_tiet
                ? baoGia.chi_tiet.map((ct: any) => this.transformChiTiet(ct))
                : [],
        };
    }

    /**
     * Transform danh sách báo giá
     */
    private transformBaoGiaList(baoGiaList: any[]) {
        return baoGiaList.map((bg) => this.transformBaoGia(bg));
    }

    /**
     * Sinh mã báo giá tự động: BG-{Timestamp}
     */
    private generateMaBaoGia(): string {
        return `BG-${Date.now()}`;
    }

    /**
     * Tính toán tiền tệ chính xác
     * Sử dụng Decimal.js thông qua Prisma.Decimal để đảm bảo độ chính xác
     */
    private calculateMoney(items: { so_luong: number; don_gia: number }[], thueVat: number) {
        // Tính thanh_tien từng dòng và tổng trước thuế
        let tongTienTruocThue = new Prisma.Decimal(0);

        const chiTietWithThanhTien = items.map((item) => {
            const thanhTien = new Prisma.Decimal(item.so_luong).mul(new Prisma.Decimal(item.don_gia));
            tongTienTruocThue = tongTienTruocThue.add(thanhTien);
            return {
                ...item,
                thanh_tien: thanhTien,
            };
        });

        // Tính tiền thuế và tổng sau thuế
        const tienThue = tongTienTruocThue.mul(new Prisma.Decimal(thueVat)).div(new Prisma.Decimal(100));
        const tongTienSauThue = tongTienTruocThue.add(tienThue);

        return {
            chiTietWithThanhTien,
            tongTienTruocThue,
            tienThue,
            tongTienSauThue,
        };
    }

    /**
     * 📌 CREATE - Tạo báo giá mới
     *
     * Flow:
     * 1. Validate khách hàng tồn tại
     * 2. Validate tất cả sản phẩm tồn tại
     * 3. Lấy giá hiện tại của từng sản phẩm (snapshot giá)
     * 4. Tính toán: thanh_tien, tong_tien_truoc_thue, tien_thue, tong_tien_sau_thue
     * 5. Sử dụng transaction để tạo BaoGia + ChiTietBaoGia
     */
    async create(dto: CreateBaoGiaDto) {
        const { id_khach_hang, items, thue_vat = 10, ...headerData } = dto;

        // 1. Validate khách hàng
        const khachHang = await this.prisma.khachHang.findFirst({
            where: { id: id_khach_hang },
        });
        if (!khachHang) {
            throw new NotFoundException(`Không tìm thấy khách hàng với ID: ${id_khach_hang}`);
        }

        // 2. Validate sản phẩm và lấy giá
        const sanPhamIds = items.map((item) => item.id_san_pham);
        const sanPhams = await this.prisma.sanPham.findMany({
            where: { id: { in: sanPhamIds } },
            select: { id: true, gia_ban: true, ten_san_pham: true },
        });

        if (sanPhams.length !== sanPhamIds.length) {
            const foundIds = sanPhams.map((sp) => sp.id);
            const notFoundIds = sanPhamIds.filter((id) => !foundIds.includes(id));
            throw new NotFoundException(
                `Không tìm thấy sản phẩm với ID: ${notFoundIds.join(', ')}`,
            );
        }

        // 3. Map giá sản phẩm
        const sanPhamMap = new Map(sanPhams.map((sp) => [sp.id, sp]));

        // 4. Prepare items với giá snapshot
        const itemsWithPrice = items.map((item) => {
            const sanPham = sanPhamMap.get(item.id_san_pham)!;
            return {
                id_san_pham: item.id_san_pham,
                so_luong: item.so_luong,
                don_gia: decimalToNumberBaoGia(sanPham.gia_ban), // Snapshot giá hiện tại
                ghi_chu: item.ghi_chu,
            };
        });

        // 5. Tính toán tiền
        const { chiTietWithThanhTien, tongTienTruocThue, tienThue, tongTienSauThue } =
            this.calculateMoney(itemsWithPrice, thue_vat);

        // 6. Transaction: Tạo báo giá + chi tiết
        const baoGiaId = uuidv4();
        const maBaoGia = this.generateMaBaoGia();

        const baoGia = await this.prisma.$transaction(async (tx) => {
            // Tạo báo giá header
            const newBaoGia = await tx.baoGia.create({
                data: {
                    id: baoGiaId,
                    ma_bao_gia: maBaoGia,
                    id_khach_hang,
                    tieu_de: headerData.tieu_de,
                    ngay_het_han: headerData.ngay_het_han
                        ? new Date(headerData.ngay_het_han)
                        : null,
                    thue_vat,
                    tong_tien_truoc_thue: tongTienTruocThue,
                    tien_thue: tienThue,
                    tong_tien_sau_thue: tongTienSauThue,
                    ghi_chu: headerData.ghi_chu,
                    trang_thai: 'DRAFT',
                } as any,
            });

            // Tạo chi tiết báo giá
            const chiTietData = chiTietWithThanhTien.map((item, index) => ({
                id: uuidv4(),
                id_bao_gia: baoGiaId,
                id_san_pham: items[index].id_san_pham,
                so_luong: item.so_luong,
                don_gia: item.don_gia,
                thanh_tien: item.thanh_tien,
                ghi_chu: items[index].ghi_chu,
            }));

            await tx.chiTietBaoGia.createMany({
                data: chiTietData as any,
            });

            // Lấy lại báo giá với relations
            return tx.baoGia.findUnique({
                where: { id: baoGiaId },
                include: this.includeRelations,
            });
        });

        this.logger.log(`Tạo báo giá: ${maBaoGia} - Khách hàng: ${(khachHang as any).ho_ten}`);
        return this.transformBaoGia(baoGia);
    }

    /**
     * 📌 FIND ALL - Danh sách báo giá với filter + phân trang
     */
    async findAll(query: QueryBaoGiaDto) {
        const {
            page = 1,
            limit = 20,
            trang_thai,
            id_khach_hang,
            tu_ngay,
            den_ngay,
            search,
        } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: any = {};

        // Filter by status
        if (trang_thai) {
            where.trang_thai = trang_thai;
        }

        // Filter by customer
        if (id_khach_hang) {
            where.id_khach_hang = id_khach_hang;
        }

        // Filter by date range
        if (tu_ngay || den_ngay) {
            where.ngay_bao_gia = {};
            if (tu_ngay) {
                where.ngay_bao_gia.gte = new Date(tu_ngay);
            }
            if (den_ngay) {
                // Set to end of day
                const endDate = new Date(den_ngay);
                endDate.setHours(23, 59, 59, 999);
                where.ngay_bao_gia.lte = endDate;
            }
        }

        // Search by ma_bao_gia or tieu_de
        if (search) {
            where.OR = [
                { ma_bao_gia: { contains: search } },
                { tieu_de: { contains: search } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.baoGia.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
                include: this.includeRelations,
            }),
            this.prisma.baoGia.count({ where }),
        ]);

        return {
            data: this.transformBaoGiaList(data),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * 📌 FIND ONE - Chi tiết báo giá
     */
    async findOne(id: string) {
        const baoGia = await this.prisma.baoGia.findFirst({
            where: { id },
            include: this.includeRelations,
        });

        if (!baoGia) {
            throw new NotFoundException(`Không tìm thấy báo giá với ID: ${id}`);
        }

        return this.transformBaoGia(baoGia);
    }

    /**
     * 📌 UPDATE STATUS - Cập nhật trạng thái báo giá
     *
     * Các transition hợp lệ:
     * - DRAFT -> SENT (Gửi cho khách)
     * - SENT -> ACCEPTED | REJECTED | EXPIRED
     * - DRAFT -> EXPIRED (Admin expire manually)
     */
    async updateStatus(id: string, dto: UpdateBaoGiaStatusDto) {
        const baoGia = await this.prisma.baoGia.findFirst({
            where: { id },
        });

        if (!baoGia) {
            throw new NotFoundException(`Không tìm thấy báo giá với ID: ${id}`);
        }

        const currentStatus = baoGia.trang_thai;
        const newStatus = dto.trang_thai;

        // Validate transition
        const validTransitions: Record<string, string[]> = {
            DRAFT: ['SENT', 'EXPIRED'],
            SENT: ['ACCEPTED', 'REJECTED', 'EXPIRED'],
            ACCEPTED: [], // Final state
            REJECTED: [], // Final state
            EXPIRED: [], // Final state
        };

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
            throw new BadRequestException(
                `Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}`,
            );
        }

        const updated = await this.prisma.baoGia.update({
            where: { id },
            data: { trang_thai: newStatus as any },
            include: this.includeRelations,
        });

        this.logger.log(`Cập nhật trạng thái báo giá ${baoGia.ma_bao_gia}: ${currentStatus} -> ${newStatus}`);
        return this.transformBaoGia(updated);
    }

    /**
     * 📌 DELETE - Xóa mềm báo giá
     * Chỉ cho phép xóa báo giá ở trạng thái DRAFT
     */
    async remove(id: string) {
        const baoGia = await this.findOne(id);

        if (baoGia.trang_thai !== TrangThaiBaoGia.DRAFT) {
            throw new BadRequestException(
                `Chỉ có thể xóa báo giá ở trạng thái DRAFT. Trạng thái hiện tại: ${baoGia.trang_thai}`,
            );
        }

        // Soft delete - CLS Middleware sẽ convert
        const deleted = await this.prisma.baoGia.delete({
            where: { id },
        });

        this.logger.log(`Xóa báo giá: ${baoGia.ma_bao_gia}`);
        return this.transformBaoGia(deleted);
    }

    /**
     * 📌 STATS - Thống kê theo trạng thái
     */
    async getStatsByTrangThai() {
        const stats = await (this.prisma.baoGia.groupBy as any)({
            by: ['trang_thai'],
            _count: { id: true },
            _sum: { tong_tien_sau_thue: true },
        });

        return stats.map((s: any) => ({
            trang_thai: s.trang_thai,
            count: s._count?.id || 0,
            tong_tien: decimalToNumberBaoGia(s._sum?.tong_tien_sau_thue),
        }));
    }

    /**
     * 📌 COUNT - Đếm tổng số báo giá
     */
    async count() {
        return this.prisma.baoGia.count({});
    }
}
