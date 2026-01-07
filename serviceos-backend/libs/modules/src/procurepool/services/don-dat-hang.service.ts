/**
 * ============================================================
 * ĐƠN ĐẶT HÀNG NCC SERVICE - ProcurePool Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * PURCHASE ORDER MANAGEMENT:
 * - Create PO (Draft/Ordered)
 * - Confirm Order (Draft -> Ordered)
 * - Receive Goods  (Integration with TonKhoService.nhapKho)
 * - Cancel Order
 * - Search & Filter
 *
 * Phase 10: ProcurePool - Procurement Management
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import {
    CreateDonDatHangDto,
    UpdateDonDatHangDto,
    ConfirmOrderDto,
    ReceiveGoodsDto,
    CancelOrderDto,
    QueryDonDatHangDto,
    TrangThaiDonHangNCC,
    decimalToNumberPO,
} from '../dto/don-dat-hang.dto';
import { TonKhoService } from '../../stockpile/services/ton-kho.service';

@Injectable()
export class DonDatHangService {
    private readonly logger = new Logger(DonDatHangService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => TonKhoService))
        private readonly tonKhoService: TonKhoService,
    ) { }

    /**
     * Sinh mã đơn hàng tự động: PO-YYYY-XXXX
     */
    private async generateMaDonHang(idDoanhNghiep: string): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.prisma.donDatHangNcc.count({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                ngay_tao: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            },
        });
        return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    /**
     * Transform response với decimal conversion
     */
    private transformDonDatHang(don: any) {
        if (!don) return don;
        return {
            ...don,
            tong_tien: decimalToNumberPO(don.tong_tien),
            chi_tiet_don_dat_hang: don.chi_tiet_don_dat_hang?.map((ct: any) => ({
                ...ct,
                don_gia: decimalToNumberPO(ct.don_gia),
                thanh_tien: decimalToNumberPO(ct.thanh_tien),
            })),
        };
    }

    // ============================================================
    // CREATE PO
    // ============================================================

    /**
     * Tạo đơn đặt hàng mới (Purchase Order)
     */
    async createPO(
        idDoanhNghiep: string,
        dto: CreateDonDatHangDto,
        nguoiTaoId?: string,
    ) {
        const { nha_cung_cap_id, items, ma_don_hang, ngay_giao_du_kien, ghi_chu, trang_thai = TrangThaiDonHangNCC.DRAFT } = dto;

        // 1. Validate NCC tồn tại và thuộc doanh nghiệp
        const nhaCungCap = await this.prisma.nhaCungCap.findFirst({
            where: {
                id: nha_cung_cap_id,
                id_doanh_nghiep: idDoanhNghiep,
                trang_thai: 1,
                ngay_xoa: null,
            },
        });
        if (!nhaCungCap) {
            throw new NotFoundException(
                `Không tìm thấy nhà cung cấp với ID: ${nha_cung_cap_id}`,
            );
        }

        // 2. Validate tất cả sản phẩm tồn tại
        const sanPhamIds = items.map((item) => item.san_pham_id);
        const sanPhams = await this.prisma.sanPham.findMany({
            where: {
                id: { in: sanPhamIds },
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (sanPhams.length !== sanPhamIds.length) {
            const foundIds = sanPhams.map((sp) => sp.id);
            const notFoundIds = sanPhamIds.filter((id) => !foundIds.includes(id));
            throw new NotFoundException(
                `Không tìm thấy sản phẩm với ID: ${notFoundIds.join(', ')}`,
            );
        }

        // 3. Sinh mã đơn hàng
        const maDonHang = ma_don_hang || (await this.generateMaDonHang(idDoanhNghiep));

        // 4. Tính tổng tiền
        const tongTien = items.reduce(
            (sum, item) => sum + item.so_luong * item.don_gia,
            0,
        );

        // 5. Transaction: Tạo đơn + chi tiết
        const result = await this.prisma.$transaction(async (tx) => {
            // 5.1 Tạo đơn đặt hàng
            const donId = uuidv4();
            const donDatHang = await tx.donDatHangNcc.create({
                data: {
                    id: donId,
                    id_doanh_nghiep: idDoanhNghiep,
                    id_nha_cung_cap: nha_cung_cap_id,
                    ma_don_hang: maDonHang,
                    ngay_dat: trang_thai === TrangThaiDonHangNCC.ORDERED ? new Date() : null,
                    ngay_giao_du_kien: ngay_giao_du_kien ? new Date(ngay_giao_du_kien) : null,
                    tong_tien: tongTien,
                    trang_thai: trang_thai,
                    ghi_chu,
                    nguoi_tao_id: nguoiTaoId,
                },
            });

            // 5.2 Tạo chi tiết đơn hàng
            const sanPhamMap = new Map(sanPhams.map((sp) => [sp.id, sp]));
            for (const item of items) {
                const sanPham = sanPhamMap.get(item.san_pham_id);
                await tx.chiTietDonDatHang.create({
                    data: {
                        id: uuidv4(),
                        id_doanh_nghiep: idDoanhNghiep,
                        id_don_dat_hang: donId,
                        id_san_pham: item.san_pham_id,
                        ten_san_pham: sanPham?.ten_san_pham || '',
                        so_luong: item.so_luong,
                        don_gia: item.don_gia,
                        thanh_tien: item.so_luong * item.don_gia,
                        so_luong_da_nhan: 0,
                        ghi_chu: item.ghi_chu,
                        nguoi_tao_id: nguoiTaoId,
                    },
                });
            }

            return donDatHang;
        });

        this.logger.log(
            `🛒 Tạo PO: ${maDonHang} - NCC: ${nhaCungCap.ten_nha_cung_cap} - ${items.length} SP - ${tongTien.toLocaleString()}đ (DN: ${idDoanhNghiep})`,
        );

        // Return với include
        return this.findOne(idDoanhNghiep, result.id);
    }

    // ============================================================
    // READ
    // ============================================================

    /**
     * Lấy danh sách đơn đặt hàng có phân trang & filter
     */
    async findAll(idDoanhNghiep: string, query: QueryDonDatHangDto) {
        const {
            page = 1,
            limit = 10,
            search,
            nha_cung_cap_id,
            trang_thai,
            tu_ngay,
            den_ngay,
            sortBy = 'ngay_tao',
            sortOrder = 'desc',
        } = query;

        // Build where clause
        const where: any = {
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        // Search filter (mã đơn)
        if (search) {
            where.ma_don_hang = { contains: search };
        }

        // NCC filter
        if (nha_cung_cap_id) {
            where.id_nha_cung_cap = nha_cung_cap_id;
        }

        // Status filter
        if (trang_thai !== undefined) {
            where.trang_thai = trang_thai;
        }

        // Date range filter
        if (tu_ngay || den_ngay) {
            where.ngay_tao = {};
            if (tu_ngay) {
                where.ngay_tao.gte = new Date(tu_ngay);
            }
            if (den_ngay) {
                where.ngay_tao.lte = new Date(`${den_ngay}T23:59:59.999Z`);
            }
        }

        // Count total
        const total = await this.prisma.donDatHangNcc.count({ where });

        // Get data with pagination
        const data = await this.prisma.donDatHangNcc.findMany({
            where,
            include: {
                nha_cung_cap: {
                    select: {
                        id: true,
                        ma_ncc: true,
                        ten_nha_cung_cap: true,
                        so_dien_thoai: true,
                    },
                },
                kho: {
                    select: {
                        id: true,
                        ten_kho: true,
                    },
                },
                _count: {
                    select: {
                        chi_tiet_don_dat_hang: true,
                    },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
        });

        return {
            data: data.map(this.transformDonDatHang),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy chi tiết đơn đặt hàng
     */
    async findOne(idDoanhNghiep: string, id: string) {
        const don = await this.prisma.donDatHangNcc.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: {
                nha_cung_cap: {
                    select: {
                        id: true,
                        ma_ncc: true,
                        ten_nha_cung_cap: true,
                        nguoi_lien_he: true,
                        email: true,
                        so_dien_thoai: true,
                        dia_chi: true,
                    },
                },
                kho: {
                    select: {
                        id: true,
                        ten_kho: true,
                    },
                },
                chi_tiet_don_dat_hang: {
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

        if (!don) {
            throw new NotFoundException(`Không tìm thấy đơn đặt hàng với ID: ${id}`);
        }

        return this.transformDonDatHang(don);
    }

    // ============================================================
    // UPDATE
    // ============================================================

    /**
     * Cập nhật đơn đặt hàng (chỉ cho DRAFT)
     */
    async update(
        idDoanhNghiep: string,
        id: string,
        dto: UpdateDonDatHangDto,
        nguoiCapNhatId?: string,
    ) {
        // 1. Kiểm tra đơn tồn tại và ở trạng thái DRAFT
        const existing = await this.prisma.donDatHangNcc.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Không tìm thấy đơn đặt hàng với ID: ${id}`);
        }

        if (existing.trang_thai !== TrangThaiDonHangNCC.DRAFT) {
            throw new BadRequestException(
                'Chỉ có thể cập nhật đơn hàng ở trạng thái Nháp (DRAFT)',
            );
        }

        // 2. Nếu có items mới, validate và cập nhật
        if (dto.items && dto.items.length > 0) {
            const sanPhamIds = dto.items.map((item) => item.san_pham_id);
            const sanPhams = await this.prisma.sanPham.findMany({
                where: {
                    id: { in: sanPhamIds },
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                },
            });

            if (sanPhams.length !== sanPhamIds.length) {
                throw new NotFoundException('Một số sản phẩm không tồn tại');
            }

            // Tính tổng tiền mới
            const tongTien = dto.items.reduce(
                (sum, item) => sum + item.so_luong * item.don_gia,
                0,
            );

            // Transaction: Xóa chi tiết cũ, tạo mới
            await this.prisma.$transaction(async (tx) => {
                // Xóa chi tiết cũ
                await tx.chiTietDonDatHang.deleteMany({
                    where: { id_don_dat_hang: id },
                });

                // Tạo chi tiết mới
                const sanPhamMap = new Map(sanPhams.map((sp) => [sp.id, sp]));
                for (const item of dto.items!) {
                    const sanPham = sanPhamMap.get(item.san_pham_id);
                    await tx.chiTietDonDatHang.create({
                        data: {
                            id: uuidv4(),
                            id_doanh_nghiep: idDoanhNghiep,
                            id_don_dat_hang: id,
                            id_san_pham: item.san_pham_id,
                            ten_san_pham: sanPham?.ten_san_pham || '',
                            so_luong: item.so_luong,
                            don_gia: item.don_gia,
                            thanh_tien: item.so_luong * item.don_gia,
                            so_luong_da_nhan: 0,
                            ghi_chu: item.ghi_chu,
                            nguoi_tao_id: nguoiCapNhatId,
                        },
                    });
                }

                // Cập nhật đơn
                await tx.donDatHangNcc.update({
                    where: { id },
                    data: {
                        ngay_giao_du_kien: dto.ngay_giao_du_kien
                            ? new Date(dto.ngay_giao_du_kien)
                            : undefined,
                        ghi_chu: dto.ghi_chu,
                        tong_tien: tongTien,
                        nguoi_cap_nhat_id: nguoiCapNhatId,
                    },
                });
            });
        } else {
            // Chỉ cập nhật thông tin cơ bản
            await this.prisma.donDatHangNcc.update({
                where: { id },
                data: {
                    ngay_giao_du_kien: dto.ngay_giao_du_kien
                        ? new Date(dto.ngay_giao_du_kien)
                        : undefined,
                    ghi_chu: dto.ghi_chu,
                    nguoi_cap_nhat_id: nguoiCapNhatId,
                },
            });
        }

        this.logger.log(`✏️ Cập nhật PO: ${id} (DN: ${idDoanhNghiep})`);

        return this.findOne(idDoanhNghiep, id);
    }

    // ============================================================
    // CONFIRM ORDER (DRAFT -> ORDERED)
    // ============================================================

    /**
     * Xác nhận đơn hàng (chuyển từ DRAFT sang ORDERED)
     */
    async confirmOrder(
        idDoanhNghiep: string,
        id: string,
        dto: ConfirmOrderDto,
        nguoiCapNhatId?: string,
    ) {
        // 1. Kiểm tra đơn
        const don = await this.prisma.donDatHangNcc.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (!don) {
            throw new NotFoundException(`Không tìm thấy đơn đặt hàng với ID: ${id}`);
        }

        if (don.trang_thai !== TrangThaiDonHangNCC.DRAFT) {
            throw new BadRequestException(
                'Chỉ có thể xác nhận đơn hàng ở trạng thái Nháp (DRAFT)',
            );
        }

        // 2. Cập nhật trạng thái
        await this.prisma.donDatHangNcc.update({
            where: { id },
            data: {
                trang_thai: TrangThaiDonHangNCC.ORDERED,
                ngay_dat: dto.ngay_dat ? new Date(dto.ngay_dat) : new Date(),
                nguoi_cap_nhat_id: nguoiCapNhatId,
            },
        });

        this.logger.log(
            `✅ Xác nhận PO: ${don.ma_don_hang} -> ORDERED (DN: ${idDoanhNghiep})`,
        );

        return this.findOne(idDoanhNghiep, id);
    }

    // ============================================================
    // RECEIVE GOODS  (KEY INTEGRATION)
    // ============================================================

    /**
     * Nhận hàng - Tích hợp với TonKhoService.nhapKho
     *
     * Logic Transaction:
     * 1. Validate PO có trạng thái ORDERED
     * 2. Validate kho nhập thuộc doanh nghiệp
     * 3. Gọi TonKhoService.nhapKho để tăng tồn kho
     * 4. Cập nhật PO: trạng thái -> RECEIVED, ngay_giao_thuc_te = now()
     * 5. Cập nhật so_luong_da_nhan cho chi tiết
     */
    async receiveGoods(
        idDoanhNghiep: string,
        id: string,
        dto: ReceiveGoodsDto,
        nguoiCapNhatId?: string,
    ) {
        const { kho_nhap_id, ghi_chu } = dto;

        // 1. Validate PO tồn tại và trạng thái ORDERED
        const don = await this.prisma.donDatHangNcc.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: {
                chi_tiet_don_dat_hang: {
                    where: { ngay_xoa: null },
                },
            },
        });

        if (!don) {
            throw new NotFoundException(`Không tìm thấy đơn đặt hàng với ID: ${id}`);
        }

        if (don.trang_thai !== TrangThaiDonHangNCC.ORDERED) {
            throw new BadRequestException(
                'Chỉ có thể nhận hàng cho đơn ở trạng thái Đã đặt (ORDERED)',
            );
        }

        if (!don.chi_tiet_don_dat_hang || don.chi_tiet_don_dat_hang.length === 0) {
            throw new BadRequestException('Đơn hàng không có chi tiết');
        }

        // 2. Validate kho nhập thuộc doanh nghiệp
        const kho = await this.prisma.kho.findFirst({
            where: {
                id: kho_nhap_id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (!kho) {
            throw new NotFoundException(`Không tìm thấy kho với ID: ${kho_nhap_id}`);
        }

        // 3. Chuẩn bị items để nhập kho
        const itemsToImport = don.chi_tiet_don_dat_hang
            .filter((ct) => ct.id_san_pham) // Chỉ lấy những item có sản phẩm
            .map((ct) => ({
                san_pham_id: ct.id_san_pham!,
                so_luong: ct.so_luong,
                don_gia: decimalToNumberPO(ct.don_gia),
            }));

        if (itemsToImport.length === 0) {
            throw new BadRequestException('Không có sản phẩm hợp lệ để nhập kho');
        }

        // 4. Import NguonNhap enum from StockPile
        const { NguonNhap } = await import('../../stockpile/dto/ton-kho.dto');

        // 5. Transaction: Nhập kho + Cập nhật PO
        const result = await this.prisma.$transaction(async (tx) => {
            // 5.1 Gọi TonKhoService.nhapKho
            // Lưu ý: TonKhoService sử dụng prisma của riêng nó, không trong transaction này
            // Nên chúng ta sẽ gọi riêng và xử lý rollback nếu cần
            const nhapKhoResult = await this.tonKhoService.nhapKho(
                idDoanhNghiep,
                {
                    kho_id: kho_nhap_id,
                    items: itemsToImport,
                    ly_do: `Nhận hàng từ đơn PO: ${don.ma_don_hang}`,
                    nguon_nhap: NguonNhap.DON_HANG_NCC,
                },
                nguoiCapNhatId,
            );

            // 5.2 Cập nhật PO
            await tx.donDatHangNcc.update({
                where: { id },
                data: {
                    id_kho: kho_nhap_id,
                    trang_thai: TrangThaiDonHangNCC.RECEIVED,
                    ngay_giao_thuc_te: new Date(),
                    ghi_chu: ghi_chu
                        ? `${don.ghi_chu || ''}\n[Nhận hàng]: ${ghi_chu}`
                        : don.ghi_chu,
                    nguoi_cap_nhat_id: nguoiCapNhatId,
                },
            });

            // 5.3 Cập nhật so_luong_da_nhan cho chi tiết
            for (const ct of don.chi_tiet_don_dat_hang) {
                await tx.chiTietDonDatHang.update({
                    where: { id: ct.id },
                    data: {
                        so_luong_da_nhan: ct.so_luong,
                        nguoi_cap_nhat_id: nguoiCapNhatId,
                    },
                });
            }

            return nhapKhoResult;
        });

        this.logger.log(
            `📦 Nhận hàng PO: ${don.ma_don_hang} -> Kho: ${kho.ten_kho} (DN: ${idDoanhNghiep})`,
        );

        return {
            message: 'Nhận hàng thành công',
            don_dat_hang: await this.findOne(idDoanhNghiep, id),
            phieu_nhap_kho: result,
        };
    }

    // ============================================================
    // CANCEL ORDER
    // ============================================================

    /**
     * Hủy đơn hàng
     */
    async cancelOrder(
        idDoanhNghiep: string,
        id: string,
        dto: CancelOrderDto,
        nguoiCapNhatId?: string,
    ) {
        // 1. Kiểm tra đơn
        const don = await this.prisma.donDatHangNcc.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (!don) {
            throw new NotFoundException(`Không tìm thấy đơn đặt hàng với ID: ${id}`);
        }

        // Chỉ hủy được DRAFT hoặc ORDERED
        if (
            don.trang_thai !== TrangThaiDonHangNCC.DRAFT &&
            don.trang_thai !== TrangThaiDonHangNCC.ORDERED
        ) {
            throw new BadRequestException(
                'Chỉ có thể hủy đơn hàng ở trạng thái Nháp hoặc Đã đặt',
            );
        }

        // 2. Cập nhật
        await this.prisma.donDatHangNcc.update({
            where: { id },
            data: {
                trang_thai: TrangThaiDonHangNCC.CANCELLED,
                ghi_chu: `${don.ghi_chu || ''}\n[Hủy]: ${dto.ly_do_huy}`,
                nguoi_cap_nhat_id: nguoiCapNhatId,
            },
        });

        this.logger.log(
            `❌ Hủy PO: ${don.ma_don_hang} - Lý do: ${dto.ly_do_huy} (DN: ${idDoanhNghiep})`,
        );

        return this.findOne(idDoanhNghiep, id);
    }

    // ============================================================
    // DELETE (SOFT)
    // ============================================================

    /**
     * Xóa mềm đơn hàng (chỉ DRAFT hoặc CANCELLED)
     */
    async remove(idDoanhNghiep: string, id: string, nguoiXoaId?: string) {
        const don = await this.prisma.donDatHangNcc.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (!don) {
            throw new NotFoundException(`Không tìm thấy đơn đặt hàng với ID: ${id}`);
        }

        if (
            don.trang_thai !== TrangThaiDonHangNCC.DRAFT &&
            don.trang_thai !== TrangThaiDonHangNCC.CANCELLED
        ) {
            throw new BadRequestException(
                'Chỉ có thể xóa đơn hàng ở trạng thái Nháp hoặc Đã hủy',
            );
        }

        await this.prisma.$transaction([
            this.prisma.chiTietDonDatHang.updateMany({
                where: { id_don_dat_hang: id },
                data: {
                    ngay_xoa: new Date(),
                    nguoi_cap_nhat_id: nguoiXoaId,
                },
            }),
            this.prisma.donDatHangNcc.update({
                where: { id },
                data: {
                    ngay_xoa: new Date(),
                    nguoi_cap_nhat_id: nguoiXoaId,
                },
            }),
        ]);

        this.logger.log(`🗑️ Xóa PO: ${id} (DN: ${idDoanhNghiep})`);

        return { message: 'Xóa đơn đặt hàng thành công' };
    }

    // ============================================================
    // STATISTICS
    // ============================================================

    /**
     * Thống kê đơn đặt hàng
     */
    async getStats(idDoanhNghiep: string) {
        const [stats, tongGiaTri] = await Promise.all([
            this.prisma.donDatHangNcc.groupBy({
                by: ['trang_thai'],
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                },
                _count: { id: true },
            }),
            this.prisma.donDatHangNcc.aggregate({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                    trang_thai: {
                        in: [TrangThaiDonHangNCC.ORDERED, TrangThaiDonHangNCC.RECEIVED],
                    },
                },
                _sum: { tong_tien: true },
            }),
        ]);

        const countByStatus = stats.reduce(
            (acc, s) => {
                acc[s.trang_thai] = s._count.id;
                return acc;
            },
            {} as Record<number, number>,
        );

        return {
            tong_don_hang: Object.values(countByStatus).reduce((a, b) => a + b, 0),
            don_nhap: countByStatus[TrangThaiDonHangNCC.DRAFT] || 0,
            don_dang_cho: countByStatus[TrangThaiDonHangNCC.ORDERED] || 0,
            don_da_nhan: countByStatus[TrangThaiDonHangNCC.RECEIVED] || 0,
            don_da_huy: countByStatus[TrangThaiDonHangNCC.CANCELLED] || 0,
            tong_gia_tri: decimalToNumberPO(tongGiaTri._sum.tong_tien),
        };
    }
}
