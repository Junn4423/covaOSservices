/**
 * ============================================================
 * PHIẾU THU CHI SERVICE - CashFlow Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * 📌 XỬ LÝ DECIMAL:
 * Prisma trả về Prisma.Decimal object. Service này sẽ convert
 * sang number trước khi trả về cho Frontend.
 *
 * 📌 LOGIC BUSINESS:
 * - Tự động sinh mã phiếu: PT-{Time} hoặc PC-{Time}
 * - Validate số tiền > 0
 * - Ngày thực hiện default là now() nếu không gửi
 * - Soft delete với ngay_xoa
 * - Stats sử dụng aggregate để tối ưu performance
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
    CreatePhieuThuChiDto,
    UpdatePhieuThuChiDto,
    QueryPhieuThuChiDto,
    CashFlowStatsQueryDto,
    LoaiPhieuThuChi,
    decimalToNumberCashFlow,
} from '../dto/phieu-thu-chi.dto';

@Injectable()
export class PhieuThuChiService {
    private readonly logger = new Logger(PhieuThuChiService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Include relations cho query
     */
    private readonly includeRelations = {
        nguoi_dung: {
            select: {
                id: true,
                ho_ten: true,
                email: true,
            },
        },
        khach_hang: {
            select: {
                id: true,
                ho_ten: true,
                so_dien_thoai: true,
                email: true,
            },
        },
        cong_viec: {
            select: {
                id: true,
                ma_cong_viec: true,
                tieu_de: true,
            },
        },
    };

    /**
     * Transform phiếu thu/chi để convert Decimal fields sang number
     */
    private transformPhieu(phieu: any) {
        if (!phieu) return phieu;

        return {
            ...phieu,
            so_tien: decimalToNumberCashFlow(phieu.so_tien),
        };
    }

    /**
     * Transform danh sách phiếu
     */
    private transformPhieuList(phieuList: any[]) {
        return phieuList.map((p) => this.transformPhieu(p));
    }

    /**
     * Sinh mã phiếu tự động
     * - Thu: PT-{Timestamp}
     * - Chi: PC-{Timestamp}
     */
    private generateMaPhieu(loaiPhieu: LoaiPhieuThuChi): string {
        const prefix = loaiPhieu === LoaiPhieuThuChi.THU ? 'PT' : 'PC';
        return `${prefix}-${Date.now()}`;
    }

    /**
     * Lấy ngày đầu tháng hiện tại
     */
    private getStartOfMonth(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    /**
     * Lấy ngày cuối ngày hôm nay
     */
    private getEndOfToday(): Date {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        return now;
    }

    // ============================================================
    //  CREATE - Tạo phiếu thu/chi mới
    // ============================================================
    /**
     * Tạo phiếu thu/chi mới
     *
     * Flow:
     * 1. Validate số tiền > 0
     * 2. Validate công việc tồn tại (nếu có)
     * 3. Validate khách hàng tồn tại (nếu có)
     * 4. Sinh mã phiếu tự động (PT-xxx hoặc PC-xxx)
     * 5. Default ngày thực hiện = now() nếu không gửi
     * 6. Tạo phiếu và trả về kết quả
     */
    async create(dto: CreatePhieuThuChiDto, idNguoiDung: string) {
        const {
            loai_phieu,
            so_tien,
            phuong_thuc = 'tien_mat',
            ly_do,
            danh_muc,
            ngay_thuc_hien,
            id_cong_viec,
            id_khach_hang,
            anh_chung_tu,
            ghi_chu,
        } = dto;

        // 1. Validate số tiền
        if (so_tien <= 0) {
            throw new BadRequestException('Số tiền phải lớn hơn 0');
        }

        // 2. Validate công việc (nếu có)
        if (id_cong_viec) {
            const congViec = await this.prisma.congViec.findFirst({
                where: { id: id_cong_viec, ngay_xoa: null },
            });
            if (!congViec) {
                throw new NotFoundException(`Không tìm thấy công việc với ID: ${id_cong_viec}`);
            }
        }

        // 3. Validate khách hàng (nếu có)
        if (id_khach_hang) {
            const khachHang = await this.prisma.khachHang.findFirst({
                where: { id: id_khach_hang, ngay_xoa: null },
            });
            if (!khachHang) {
                throw new NotFoundException(`Không tìm thấy khách hàng với ID: ${id_khach_hang}`);
            }
        }

        // 4. Sinh mã phiếu
        const maPhieu = this.generateMaPhieu(loai_phieu);

        // 5. Default ngày thực hiện
        const ngayThucHien = ngay_thuc_hien ? new Date(ngay_thuc_hien) : new Date();

        // 6. Tạo phiếu
        const phieuId = uuidv4();
        const phieu = await this.prisma.phieuThuChi.create({
            data: {
                id: phieuId,
                ma_phieu: maPhieu,
                loai_phieu: loai_phieu as any,
                so_tien,
                phuong_thuc: phuong_thuc as any,
                ly_do,
                danh_muc,
                ngay_thuc_hien: ngayThucHien,
                id_nguoi_dung: idNguoiDung,
                id_cong_viec,
                id_khach_hang,
                anh_chung_tu,
                ghi_chu,
                trang_thai: 1,
            } as any,
            include: this.includeRelations,
        });

        this.logger.log(
            `Tạo phiếu ${loai_phieu.toUpperCase()}: ${maPhieu} - Số tiền: ${so_tien.toLocaleString('vi-VN')} VNĐ`,
        );

        return this.transformPhieu(phieu);
    }
    async findAll(query: QueryPhieuThuChiDto) {
        const {
            page = 1,
            limit = 20,
            loai_phieu,
            tu_ngay,
            den_ngay,
            id_khach_hang,
            id_cong_viec,
            danh_muc,
            phuong_thuc,
            search,
        } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: any = {
            ngay_xoa: null, // Chỉ lấy những phiếu chưa bị xóa
        };

        // Filter theo loại phiếu
        if (loai_phieu) {
            where.loai_phieu = loai_phieu;
        }

        // Filter theo thời gian
        if (tu_ngay || den_ngay) {
            where.ngay_thuc_hien = {};
            if (tu_ngay) {
                where.ngay_thuc_hien.gte = new Date(tu_ngay);
            }
            if (den_ngay) {
                const endDate = new Date(den_ngay);
                endDate.setHours(23, 59, 59, 999);
                where.ngay_thuc_hien.lte = endDate;
            }
        }

        // Filter theo khách hàng
        if (id_khach_hang) {
            where.id_khach_hang = id_khach_hang;
        }

        // Filter theo công việc
        if (id_cong_viec) {
            where.id_cong_viec = id_cong_viec;
        }

        // Filter theo danh mục
        if (danh_muc) {
            where.danh_muc = { contains: danh_muc };
        }

        // Filter theo phương thức thanh toán
        if (phuong_thuc) {
            where.phuong_thuc = phuong_thuc;
        }

        // Search theo mã phiếu, lý do
        if (search) {
            where.OR = [
                { ma_phieu: { contains: search } },
                { ly_do: { contains: search } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.phieuThuChi.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_thuc_hien: 'desc' },
                include: this.includeRelations,
            }),
            this.prisma.phieuThuChi.count({ where }),
        ]);

        return {
            data: this.transformPhieuList(data),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    //  FIND ONE - Chi tiết phiếu
    // ============================================================
    async findOne(id: string) {
        const phieu = await this.prisma.phieuThuChi.findFirst({
            where: { id, ngay_xoa: null },
            include: this.includeRelations,
        });

        if (!phieu) {
            throw new NotFoundException(`Không tìm thấy phiếu thu/chi với ID: ${id}`);
        }

        return this.transformPhieu(phieu);
    }

    // ============================================================
    //  GET STATS - Thống kê dòng tiền (Aggregate tối ưu)
    // ============================================================
    /**
     * Báo cáo tài chính nhanh
     *
     * Sử dụng prisma.aggregate để tính:
     * - Tổng thu (Total Revenue)
     * - Tổng chi (Total Expense)
     * - Tồn quỹ (Net Cashflow = Thu - Chi)
     * - Số phiếu thu/chi
     *
     * ⚡ OPTIMIZED: Sử dụng aggregate của DB, không fetch all + tính JS
     */
    async getStats(query: CashFlowStatsQueryDto) {
        // Default range: Đầu tháng đến hôm nay
        const tuNgay = query.tu_ngay ? new Date(query.tu_ngay) : this.getStartOfMonth();
        const denNgay = query.den_ngay ? new Date(query.den_ngay) : this.getEndOfToday();

        // Set denNgay to end of day
        denNgay.setHours(23, 59, 59, 999);

        const whereBase = {
            ngay_xoa: null,
            ngay_thuc_hien: {
                gte: tuNgay,
                lte: denNgay,
            },
        };

        // Aggregate thu và chi song song
        const [thuStats, chiStats] = await Promise.all([
            // Thống kê phiếu THU
            this.prisma.phieuThuChi.aggregate({
                where: {
                    ...whereBase,
                    loai_phieu: 'thu',
                },
                _sum: {
                    so_tien: true,
                },
                _count: {
                    id: true,
                },
            }),
            // Thống kê phiếu CHI
            this.prisma.phieuThuChi.aggregate({
                where: {
                    ...whereBase,
                    loai_phieu: 'chi',
                },
                _sum: {
                    so_tien: true,
                },
                _count: {
                    id: true,
                },
            }),
        ]);

        const tongThu = decimalToNumberCashFlow(thuStats._sum.so_tien);
        const tongChi = decimalToNumberCashFlow(chiStats._sum.so_tien);
        const tonQuy = tongThu - tongChi;

        this.logger.log(
            `📊 Stats [${tuNgay.toISOString().split('T')[0]} - ${denNgay.toISOString().split('T')[0]}]: Thu ${tongThu.toLocaleString('vi-VN')} | Chi ${tongChi.toLocaleString('vi-VN')} | Tồn ${tonQuy.toLocaleString('vi-VN')}`,
        );

        return {
            tong_thu: tongThu,
            tong_chi: tongChi,
            ton_quy: tonQuy,
            tu_ngay: tuNgay.toISOString().split('T')[0],
            den_ngay: denNgay.toISOString().split('T')[0],
            so_phieu_thu: thuStats._count.id,
            so_phieu_chi: chiStats._count.id,
        };
    }

    // ============================================================
    //  GET STATS BY CATEGORY - Thống kê theo danh mục
    // ============================================================
    /**
     * Thống kê theo danh mục để hiểu rõ cơ cấu thu/chi
     */
    async getStatsByCategory(query: CashFlowStatsQueryDto) {
        const tuNgay = query.tu_ngay ? new Date(query.tu_ngay) : this.getStartOfMonth();
        const denNgay = query.den_ngay ? new Date(query.den_ngay) : this.getEndOfToday();
        denNgay.setHours(23, 59, 59, 999);

        const stats = await (this.prisma.phieuThuChi.groupBy as any)({
            by: ['loai_phieu', 'danh_muc'],
            where: {
                ngay_xoa: null,
                ngay_thuc_hien: {
                    gte: tuNgay,
                    lte: denNgay,
                },
            },
            _sum: {
                so_tien: true,
            },
            _count: {
                id: true,
            },
        });

        return stats.map((s: any) => ({
            loai_phieu: s.loai_phieu,
            danh_muc: s.danh_muc || 'Chưa phân loại',
            tong_tien: decimalToNumberCashFlow(s._sum?.so_tien),
            so_phieu: s._count?.id || 0,
        }));
    }

    // ============================================================
    //  UPDATE - Cập nhật phiếu thu/chi
    // ============================================================
    /**
     * Cập nhật phiếu thu/chi
     * Cho phép sửa: lý do, số tiền, danh mục, phương thức, ảnh chứng từ, ghi chú
     */
    async update(id: string, dto: UpdatePhieuThuChiDto) {
        // Kiểm tra phiếu tồn tại
        const existingPhieu = await this.prisma.phieuThuChi.findFirst({
            where: { id, ngay_xoa: null },
        });

        if (!existingPhieu) {
            throw new NotFoundException(`Không tìm thấy phiếu thu/chi với ID: ${id}`);
        }

        // Validate số tiền nếu được cập nhật
        if (dto.so_tien !== undefined && dto.so_tien <= 0) {
            throw new BadRequestException('Số tiền phải lớn hơn 0');
        }

        // Build update data
        const updateData: any = {};
        if (dto.so_tien !== undefined) updateData.so_tien = dto.so_tien;
        if (dto.phuong_thuc !== undefined) updateData.phuong_thuc = dto.phuong_thuc;
        if (dto.ly_do !== undefined) updateData.ly_do = dto.ly_do;
        if (dto.danh_muc !== undefined) updateData.danh_muc = dto.danh_muc;
        if (dto.anh_chung_tu !== undefined) updateData.anh_chung_tu = dto.anh_chung_tu;
        if (dto.ghi_chu !== undefined) updateData.ghi_chu = dto.ghi_chu;

        const updated = await this.prisma.phieuThuChi.update({
            where: { id },
            data: updateData,
            include: this.includeRelations,
        });

        this.logger.log(`Cập nhật phiếu: ${existingPhieu.ma_phieu}`);
        return this.transformPhieu(updated);
    }

    // ============================================================
    //  REMOVE - Xóa mềm phiếu thu/chi
    // ============================================================
    /**
     * Soft Delete phiếu thu/chi
     */
    async remove(id: string) {
        const phieu = await this.findOne(id);

        // Soft delete
        const deleted = await this.prisma.phieuThuChi.update({
            where: { id },
            data: { ngay_xoa: new Date() },
            include: this.includeRelations,
        });

        this.logger.log(`Xóa phiếu: ${phieu.ma_phieu}`);
        return this.transformPhieu(deleted);
    }

    // ============================================================
    //  COUNT - Đếm tổng số phiếu
    // ============================================================
    async count() {
        return this.prisma.phieuThuChi.count({
            where: { ngay_xoa: null },
        });
    }

    // ============================================================
    //  RESTORE - Khôi phục phiếu đã xóa
    // ============================================================
    async restore(id: string) {
        const phieu = await this.prisma.phieuThuChi.findFirst({
            where: { id, ngay_xoa: { not: null } },
        });

        if (!phieu) {
            throw new NotFoundException(`Không tìm thấy phiếu đã xóa với ID: ${id}`);
        }

        const restored = await this.prisma.phieuThuChi.update({
            where: { id },
            data: { ngay_xoa: null },
            include: this.includeRelations,
        });

        this.logger.log(`Khôi phục phiếu: ${phieu.ma_phieu}`);
        return this.transformPhieu(restored);
    }
}
