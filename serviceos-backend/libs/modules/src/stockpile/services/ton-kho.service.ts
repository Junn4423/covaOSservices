/**
 * ============================================================
 * TỒN KHO SERVICE - StockPile Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * INVENTORY MANAGEMENT (COMPLEX LOGIC):
 * - Nhập kho (Import Stock)
 * - Xuất kho (Export Stock)
 * - Chuyển kho (Transfer Stock)
 * - Thẻ kho (Stock Card / Audit Trail)
 *
 * AUDIT TRAIL:
 * Mọi thay đổi về số lượng Tồn kho ĐỀU được ghi vào LichSuKho
 * TRANSACTION:
 * Sử dụng prisma.$transaction để đảm bảo toàn vẹn dữ liệu
 *
 * MULTI-TENANT:
 * Tất cả operations đều yêu cầu id_doanh_nghiep
 *
 * Phase 9: StockPile Advanced - Warehouse & Inventory
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
    NhapKhoDto,
    XuatKhoDto,
    ChuyenKhoDto,
    QueryTonKhoDto,
    QueryTheKhoDto,
    LoaiPhieuKho,
    decimalToNumberInventory,
} from '../dto/ton-kho.dto';

// Mức cảnh báo sắp hết hàng mặc định
const MUC_CANH_BAO_MAC_DINH = 10;

@Injectable()
export class TonKhoService {
    private readonly logger = new Logger(TonKhoService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Sinh mã phiếu tự động
     * - Nhập: NK-{Timestamp}
     * - Xuất: XK-{Timestamp}
     * - Chuyển: CK-{Timestamp}
     */
    private generateMaPhieu(loaiPhieu: LoaiPhieuKho): string {
        const prefixMap = {
            [LoaiPhieuKho.NHAP]: 'NK',
            [LoaiPhieuKho.XUAT]: 'XK',
            [LoaiPhieuKho.CHUYEN]: 'CK',
            [LoaiPhieuKho.KIEM_KE]: 'KK',
        };
        const prefix = prefixMap[loaiPhieu] || 'PK';
        return `${prefix}-${Date.now()}`;
    }

    /**
     * Transform sản phẩm embedded
     */
    private transformSanPham(sanPham: any) {
        if (!sanPham) return null;
        return {
            id: sanPham.id,
            ma_san_pham: sanPham.ma_san_pham,
            ten_san_pham: sanPham.ten_san_pham,
            don_vi_tinh: sanPham.don_vi_tinh,
        };
    }

    /**
     * Transform tồn kho response
     */
    private transformTonKho(tonKho: any) {
        if (!tonKho) return tonKho;
        return {
            ...tonKho,
            so_luong: tonKho.so_luong || 0,
            so_luong_dat_truoc: tonKho.so_luong_dat_truoc || 0,
            so_luong_kha_dung:
                (tonKho.so_luong || 0) - (tonKho.so_luong_dat_truoc || 0),
            san_pham: this.transformSanPham(tonKho.san_pham),
        };
    }

    /**
     * Transform lịch sử kho response
     */
    private transformLichSuKho(lichSu: any) {
        if (!lichSu) return lichSu;
        return {
            ...lichSu,
            don_gia: decimalToNumberInventory(lichSu.don_gia),
            san_pham: this.transformSanPham(lichSu.san_pham),
            kho_den: lichSu.kho_den
                ? { id: lichSu.kho_den.id, ten_kho: lichSu.kho_den.ten_kho }
                : null,
            cong_viec: lichSu.cong_viec
                ? {
                    id: lichSu.cong_viec.id,
                    ma_cong_viec: lichSu.cong_viec.ma_cong_viec,
                    tieu_de: lichSu.cong_viec.tieu_de,
                }
                : null,
        };
    }

    // ============================================================
    //  NHẬP KHO (Import Stock)
    // ============================================================
    /**
     * Nhập kho - Thêm vật tư vào kho
     *
     * Logic Transaction:
     * 1. Validate kho tồn tại
     * 2. Validate tất cả sản phẩm tồn tại
     * 3. Tạo phiếu nhập (LichSuKho với loai_phieu = NHAP)
     * 4. Upsert TonKho (tạo mới hoặc tăng số lượng)
     *
     * @param idDoanhNghiep - ID doanh nghiệp (multi-tenant)
     * @param dto - NhapKhoDto
     * @param nguoiTaoId - ID người tạo (optional)
     */
    async nhapKho(idDoanhNghiep: string, dto: NhapKhoDto, nguoiTaoId?: string) {
        const { kho_id, items, ly_do, nguon_nhap } = dto;

        // 1. Validate kho tồn tại và thuộc doanh nghiệp
        const kho = await this.prisma.kho.findFirst({
            where: {
                id: kho_id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });
        if (!kho) {
            throw new NotFoundException(`Không tìm thấy kho với ID: ${kho_id}`);
        }

        // 2. Validate và lấy thông tin tất cả sản phẩm (thuộc doanh nghiệp)
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

        // 3. Sinh mã phiếu
        const maPhieu = this.generateMaPhieu(LoaiPhieuKho.NHAP);
        const ngayTao = new Date();

        // 4. Transaction: Tạo lịch sử + Cập nhật tồn kho
        const result = await this.prisma.$transaction(async (tx) => {
            const lichSuRecords: any[] = [];

            for (const item of items) {
                const { san_pham_id, so_luong, don_gia = 0 } = item;

                // 4.1 Tạo lịch sử kho
                const lichSuId = uuidv4();
                const lichSu = await tx.lichSuKho.create({
                    data: {
                        id: lichSuId,
                        id_doanh_nghiep: idDoanhNghiep,
                        id_kho: kho_id,
                        id_san_pham: san_pham_id,
                        loai_phieu: LoaiPhieuKho.NHAP as any,
                        so_luong,
                        don_gia,
                        ly_do: ly_do || `Nhập kho từ ${nguon_nhap || 'NCC'}`,
                        ma_phieu: maPhieu,
                        nguoi_tao_id: nguoiTaoId,
                        ngay_tao: ngayTao,
                    } as any,
                    include: {
                        san_pham: {
                            select: {
                                id: true,
                                ma_san_pham: true,
                                ten_san_pham: true,
                                don_vi_tinh: true,
                            },
                        },
                    } as any,
                });
                lichSuRecords.push(this.transformLichSuKho(lichSu));

                // 4.2 Upsert TonKho
                const existingTonKho = await tx.tonKho.findFirst({
                    where: {
                        id_kho: kho_id,
                        id_san_pham: san_pham_id,
                        id_doanh_nghiep: idDoanhNghiep,
                    },
                });

                if (existingTonKho) {
                    // Increment số lượng
                    await tx.tonKho.update({
                        where: { id: existingTonKho.id },
                        data: {
                            so_luong: { increment: so_luong },
                            ngay_cap_nhat: ngayTao,
                            nguoi_cap_nhat_id: nguoiTaoId,
                        },
                    });
                } else {
                    // Create mới
                    await tx.tonKho.create({
                        data: {
                            id: uuidv4(),
                            id_doanh_nghiep: idDoanhNghiep,
                            id_kho: kho_id,
                            id_san_pham: san_pham_id,
                            so_luong,
                            so_luong_dat_truoc: 0,
                            nguoi_tao_id: nguoiTaoId,
                        } as any,
                    });
                }
            }

            return lichSuRecords;
        });

        const tongSoLuong = items.reduce((sum, item) => sum + item.so_luong, 0);
        this.logger.log(
            ` Nhập kho: ${maPhieu} - ${items.length} SP - Tổng: ${tongSoLuong} đơn vị (DN: ${idDoanhNghiep})`,
        );

        return {
            ma_phieu: maPhieu,
            loai_phieu: LoaiPhieuKho.NHAP,
            so_items: items.length,
            tong_so_luong: tongSoLuong,
            ly_do,
            ngay_tao: ngayTao,
            chi_tiet: result,
        };
    }

    // ============================================================
    //  XUẤT KHO (Export Stock)
    // ============================================================
    /**
     * Xuất kho - Sử dụng vật tư cho công việc hoặc mục đích khác
     *
     * Logic Transaction:
     * 1. Validate kho tồn tại
     * 2. Validate công việc tồn tại (nếu có)
     * 3. Validate tất cả sản phẩm có đủ tồn kho
     * 4. Tạo phiếu xuất (LichSuKho với loai_phieu = XUAT)
     * 5. Decrement TonKho
     *
     * @param idDoanhNghiep - ID doanh nghiệp (multi-tenant)
     * @param dto - XuatKhoDto
     * @param nguoiTaoId - ID người tạo (optional)
     */
    async xuatKho(idDoanhNghiep: string, dto: XuatKhoDto, nguoiTaoId?: string) {
        const { kho_id, items, cong_viec_id, ly_do } = dto;

        // 1. Validate kho tồn tại và thuộc doanh nghiệp
        const kho = await this.prisma.kho.findFirst({
            where: {
                id: kho_id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });
        if (!kho) {
            throw new NotFoundException(`Không tìm thấy kho với ID: ${kho_id}`);
        }

        // 2. Validate công việc (nếu có) và thuộc doanh nghiệp
        if (cong_viec_id) {
            const congViec = await this.prisma.congViec.findFirst({
                where: {
                    id: cong_viec_id,
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                },
            });
            if (!congViec) {
                throw new NotFoundException(
                    `Không tìm thấy công việc với ID: ${cong_viec_id}`,
                );
            }
        }

        // 3. Validate tồn kho đủ cho tất cả items
        const errors: string[] = [];
        const sanPhamIds = items.map((item) => item.san_pham_id);

        // Lấy thông tin tồn kho
        const tonKhoList = await (this.prisma.tonKho.findMany as any)({
            where: {
                id_kho: kho_id,
                id_san_pham: { in: sanPhamIds },
                id_doanh_nghiep: idDoanhNghiep,
            },
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
        });

        const tonKhoMap = new Map(
            tonKhoList.map((tk) => [tk.id_san_pham, tk]),
        );

        for (const item of items) {
            const tonKho = tonKhoMap.get(item.san_pham_id);
            if (!tonKho) {
                errors.push(
                    `Sản phẩm ID "${item.san_pham_id}" không có trong kho`,
                );
            } else {
                const soLuongKhaDung =
                    (tonKho as any).so_luong - (tonKho as any).so_luong_dat_truoc;
                if (soLuongKhaDung < item.so_luong) {
                    errors.push(
                        `"${(tonKho as any).san_pham?.ten_san_pham}": Yêu cầu ${item.so_luong}, chỉ có ${soLuongKhaDung} (tồn: ${(tonKho as any).so_luong}, đặt trước: ${(tonKho as any).so_luong_dat_truoc})`,
                    );
                }
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException({
                message: 'Không đủ tồn kho để xuất',
                errors,
            });
        }

        // 4. Sinh mã phiếu
        const maPhieu = this.generateMaPhieu(LoaiPhieuKho.XUAT);
        const ngayTao = new Date();

        // 5. Transaction: Tạo lịch sử + Giảm tồn kho
        const result = await this.prisma.$transaction(async (tx) => {
            const lichSuRecords: any[] = [];

            for (const item of items) {
                const { san_pham_id, so_luong } = item;
                const tonKho = tonKhoMap.get(san_pham_id)!;

                // 5.1 Tạo lịch sử kho
                const lichSuId = uuidv4();
                const lichSu = await tx.lichSuKho.create({
                    data: {
                        id: lichSuId,
                        id_doanh_nghiep: idDoanhNghiep,
                        id_kho: kho_id,
                        id_san_pham: san_pham_id,
                        id_cong_viec: cong_viec_id,
                        loai_phieu: LoaiPhieuKho.XUAT as any,
                        so_luong,
                        ly_do:
                            ly_do ||
                            (cong_viec_id
                                ? `Xuất cho công việc ${cong_viec_id}`
                                : 'Xuất kho'),
                        ma_phieu: maPhieu,
                        nguoi_tao_id: nguoiTaoId,
                        ngay_tao: ngayTao,
                    } as any,
                    include: {
                        san_pham: {
                            select: {
                                id: true,
                                ma_san_pham: true,
                                ten_san_pham: true,
                                don_vi_tinh: true,
                            },
                        },
                        cong_viec: {
                            select: {
                                id: true,
                                ma_cong_viec: true,
                                tieu_de: true,
                            },
                        },
                    } as any,
                });
                lichSuRecords.push(this.transformLichSuKho(lichSu));

                // 5.2 Decrement tồn kho
                await tx.tonKho.update({
                    where: { id: (tonKho as any).id },
                    data: {
                        so_luong: { decrement: so_luong },
                        ngay_cap_nhat: ngayTao,
                        nguoi_cap_nhat_id: nguoiTaoId,
                    },
                });
            }

            return lichSuRecords;
        });

        const tongSoLuong = items.reduce((sum, item) => sum + item.so_luong, 0);
        this.logger.log(
            `📤 Xuất kho: ${maPhieu} - ${items.length} SP - Tổng: ${tongSoLuong} đơn vị${cong_viec_id ? ` - CV: ${cong_viec_id}` : ''} (DN: ${idDoanhNghiep})`,
        );

        return {
            ma_phieu: maPhieu,
            loai_phieu: LoaiPhieuKho.XUAT,
            so_items: items.length,
            tong_so_luong: tongSoLuong,
            ly_do,
            ngay_tao: ngayTao,
            chi_tiet: result,
        };
    }

    // ============================================================
    //  CHUYỂN KHO (Transfer Stock)
    // ============================================================
    /**
     * Chuyển kho - Di chuyển vật tư từ kho này sang kho khác
     *
     * Logic Transaction:
     * 1. Validate kho xuất và kho nhập tồn tại
     * 2. Validate không trùng kho
     * 3. Validate tồn kho đủ ở kho xuất
     * 4. Tạo phiếu chuyển (LichSuKho với loai_phieu = CHUYEN)
     * 5. Decrement tồn kho nguồn
     * 6. Increment tồn kho đích
     *
     * @param idDoanhNghiep - ID doanh nghiệp (multi-tenant)
     * @param dto - ChuyenKhoDto
     * @param nguoiTaoId - ID người tạo (optional)
     */
    async chuyenKho(idDoanhNghiep: string, dto: ChuyenKhoDto, nguoiTaoId?: string) {
        const { tu_kho_id, den_kho_id, items, ly_do } = dto;

        // 1. Validate không trùng kho
        if (tu_kho_id === den_kho_id) {
            throw new BadRequestException('Kho xuất và kho nhập không được trùng nhau');
        }

        // 2. Validate kho xuất tồn tại và thuộc doanh nghiệp
        const tuKho = await this.prisma.kho.findFirst({
            where: {
                id: tu_kho_id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });
        if (!tuKho) {
            throw new NotFoundException(
                `Không tìm thấy kho xuất với ID: ${tu_kho_id}`,
            );
        }

        // 3. Validate kho nhập tồn tại và thuộc doanh nghiệp
        const denKho = await this.prisma.kho.findFirst({
            where: {
                id: den_kho_id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });
        if (!denKho) {
            throw new NotFoundException(
                `Không tìm thấy kho nhập với ID: ${den_kho_id}`,
            );
        }

        // 4. Validate tồn kho đủ cho tất cả items ở kho xuất
        const errors: string[] = [];
        const sanPhamIds = items.map((item) => item.san_pham_id);

        const tonKhoList = await (this.prisma.tonKho.findMany as any)({
            where: {
                id_kho: tu_kho_id,
                id_san_pham: { in: sanPhamIds },
                id_doanh_nghiep: idDoanhNghiep,
            },
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
        });

        const tonKhoMap = new Map(
            tonKhoList.map((tk) => [tk.id_san_pham, tk]),
        );

        for (const item of items) {
            const tonKho = tonKhoMap.get(item.san_pham_id);
            if (!tonKho) {
                errors.push(
                    `Sản phẩm ID "${item.san_pham_id}" không có trong kho xuất`,
                );
            } else {
                const soLuongKhaDung =
                    (tonKho as any).so_luong - (tonKho as any).so_luong_dat_truoc;
                if (soLuongKhaDung < item.so_luong) {
                    errors.push(
                        `"${(tonKho as any).san_pham?.ten_san_pham}": Yêu cầu ${item.so_luong}, chỉ có ${soLuongKhaDung}`,
                    );
                }
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException({
                message: 'Không đủ tồn kho để chuyển',
                errors,
            });
        }

        // 5. Sinh mã phiếu
        const maPhieu = this.generateMaPhieu(LoaiPhieuKho.CHUYEN);
        const ngayTao = new Date();

        // 6. Transaction: Tạo lịch sử + Di chuyển tồn kho
        const result = await this.prisma.$transaction(async (tx) => {
            const lichSuRecords: any[] = [];

            for (const item of items) {
                const { san_pham_id, so_luong } = item;
                const tonKhoNguon = tonKhoMap.get(san_pham_id)!;

                // 6.1 Tạo lịch sử kho (ghi cả kho đích)
                const lichSuId = uuidv4();
                const lichSu = await tx.lichSuKho.create({
                    data: {
                        id: lichSuId,
                        id_doanh_nghiep: idDoanhNghiep,
                        id_kho: tu_kho_id,
                        id_kho_den: den_kho_id,
                        id_san_pham: san_pham_id,
                        loai_phieu: LoaiPhieuKho.CHUYEN as any,
                        so_luong,
                        ly_do:
                            ly_do ||
                            `Chuyển từ "${tuKho.ten_kho}" đến "${denKho.ten_kho}"`,
                        ma_phieu: maPhieu,
                        nguoi_tao_id: nguoiTaoId,
                        ngay_tao: ngayTao,
                    } as any,
                    include: {
                        san_pham: {
                            select: {
                                id: true,
                                ma_san_pham: true,
                                ten_san_pham: true,
                                don_vi_tinh: true,
                            },
                        },
                        kho_den: {
                            select: { id: true, ten_kho: true },
                        },
                    } as any,
                });
                lichSuRecords.push(this.transformLichSuKho(lichSu));

                // 6.2 Giảm tồn kho nguồn
                await tx.tonKho.update({
                    where: { id: (tonKhoNguon as any).id },
                    data: {
                        so_luong: { decrement: so_luong },
                        ngay_cap_nhat: ngayTao,
                        nguoi_cap_nhat_id: nguoiTaoId,
                    },
                });

                // 6.3 Tăng/Tạo tồn kho đích
                const tonKhoDich = await tx.tonKho.findFirst({
                    where: {
                        id_kho: den_kho_id,
                        id_san_pham: san_pham_id,
                        id_doanh_nghiep: idDoanhNghiep,
                    },
                });

                if (tonKhoDich) {
                    await tx.tonKho.update({
                        where: { id: tonKhoDich.id },
                        data: {
                            so_luong: { increment: so_luong },
                            ngay_cap_nhat: ngayTao,
                            nguoi_cap_nhat_id: nguoiTaoId,
                        },
                    });
                } else {
                    await tx.tonKho.create({
                        data: {
                            id: uuidv4(),
                            id_doanh_nghiep: idDoanhNghiep,
                            id_kho: den_kho_id,
                            id_san_pham: san_pham_id,
                            so_luong,
                            so_luong_dat_truoc: 0,
                            nguoi_tao_id: nguoiTaoId,
                        } as any,
                    });
                }
            }

            return lichSuRecords;
        });

        const tongSoLuong = items.reduce((sum, item) => sum + item.so_luong, 0);
        this.logger.log(
            `🔄 Chuyển kho: ${maPhieu} - ${items.length} SP - Tổng: ${tongSoLuong} đơn vị - Từ "${tuKho.ten_kho}" đến "${denKho.ten_kho}" (DN: ${idDoanhNghiep})`,
        );

        return {
            ma_phieu: maPhieu,
            loai_phieu: LoaiPhieuKho.CHUYEN,
            so_items: items.length,
            tong_so_luong: tongSoLuong,
            ly_do,
            tu_kho: { id: tuKho.id, ten_kho: tuKho.ten_kho },
            den_kho: { id: denKho.id, ten_kho: denKho.ten_kho },
            ngay_tao: ngayTao,
            chi_tiet: result,
        };
    }

    // ============================================================
    //  GET TỒN KHO (Inventory List)
    // ============================================================
    /**
     * Lấy danh sách tồn kho theo kho
     * Filter: sắp hết hàng, search tên sản phẩm
     *
     * @param idDoanhNghiep - ID doanh nghiệp (multi-tenant)
     * @param query - QueryTonKhoDto
     */
    async getTonKho(idDoanhNghiep: string, query: QueryTonKhoDto) {
        const { page = 1, limit = 20, kho_id, search, sap_het_hang } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: any = {
            id_kho: kho_id,
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        // Filter sắp hết hàng
        if (sap_het_hang) {
            where.so_luong = { lte: MUC_CANH_BAO_MAC_DINH };
        }

        // Search theo tên sản phẩm
        if (search) {
            where.san_pham = {
                OR: [
                    { ten_san_pham: { contains: search } },
                    { ma_san_pham: { contains: search } },
                ],
            };
        }

        const [data, total] = await Promise.all([
            (this.prisma.tonKho.findMany as any)({
                where,
                skip,
                take: limit,
                orderBy: { ngay_cap_nhat: 'desc' },
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
            }),
            this.prisma.tonKho.count({ where }),
        ]);

        return {
            data: data.map((tk) => this.transformTonKho(tk)),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    //  GET THẺ KHO (Stock Card / Audit Trail)
    // ============================================================
    /**
     * Xem lịch sử biến động của 1 sản phẩm cụ thể trong 1 kho
     *
     * @param idDoanhNghiep - ID doanh nghiệp (multi-tenant)
     * @param query - QueryTheKhoDto
     */
    async getTheKho(idDoanhNghiep: string, query: QueryTheKhoDto) {
        const {
            page = 1,
            limit = 20,
            kho_id,
            san_pham_id,
            tu_ngay,
            den_ngay,
            loai_phieu,
        } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: any = {
            id_kho: kho_id,
            id_san_pham: san_pham_id,
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        // Filter theo thời gian
        if (tu_ngay || den_ngay) {
            where.ngay_tao = {};
            if (tu_ngay) {
                where.ngay_tao.gte = new Date(tu_ngay);
            }
            if (den_ngay) {
                const endDate = new Date(den_ngay);
                endDate.setHours(23, 59, 59, 999);
                where.ngay_tao.lte = endDate;
            }
        }

        // Filter theo loại phiếu
        if (loai_phieu) {
            where.loai_phieu = loai_phieu;
        }

        const [data, total, sanPham, tonKho] = await Promise.all([
            (this.prisma.lichSuKho.findMany as any)({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
                include: {
                    san_pham: {
                        select: {
                            id: true,
                            ma_san_pham: true,
                            ten_san_pham: true,
                            don_vi_tinh: true,
                        },
                    },
                    kho_den: {
                        select: { id: true, ten_kho: true },
                    },
                    cong_viec: {
                        select: {
                            id: true,
                            ma_cong_viec: true,
                            tieu_de: true,
                        },
                    },
                },
            }),
            this.prisma.lichSuKho.count({ where }),
            // Lấy thông tin sản phẩm
            (this.prisma.sanPham.findFirst as any)({
                where: {
                    id: san_pham_id,
                    id_doanh_nghiep: idDoanhNghiep,
                },
                select: {
                    id: true,
                    ma_san_pham: true,
                    ten_san_pham: true,
                    don_vi_tinh: true,
                },
            }),
            // Lấy tồn kho hiện tại
            this.prisma.tonKho.findFirst({
                where: {
                    id_kho: kho_id,
                    id_san_pham: san_pham_id,
                    id_doanh_nghiep: idDoanhNghiep,
                },
            }),
        ]);

        return {
            san_pham: sanPham,
            ton_kho_hien_tai: tonKho ? tonKho.so_luong : 0,
            data: data.map((ls) => this.transformLichSuKho(ls)),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    //  GET TỒN KHO BY SẢN PHẨM (Across all warehouses)
    // ============================================================
    /**
     * Lấy tồn kho của 1 sản phẩm ở tất cả các kho
     *
     * @param idDoanhNghiep - ID doanh nghiệp (multi-tenant)
     * @param sanPhamId - ID sản phẩm
     */
    async getTonKhoBySanPham(idDoanhNghiep: string, sanPhamId: string) {
        const sanPham = await this.prisma.sanPham.findFirst({
            where: {
                id: sanPhamId,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (!sanPham) {
            throw new NotFoundException(
                `Không tìm thấy sản phẩm với ID: ${sanPhamId}`,
            );
        }

        const tonKhoList = await this.prisma.tonKho.findMany({
            where: {
                id_san_pham: sanPhamId,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: {
                kho: {
                    select: {
                        id: true,
                        ten_kho: true,
                        loai_kho: true,
                    },
                },
            },
        });

        const tongTonKho = tonKhoList.reduce((sum, tk) => sum + tk.so_luong, 0);

        return {
            san_pham: this.transformSanPham(sanPham),
            tong_ton_kho: tongTonKho,
            chi_tiet: tonKhoList.map((tk) => ({
                id: tk.id,
                kho: tk.kho,
                so_luong: tk.so_luong,
                so_luong_dat_truoc: tk.so_luong_dat_truoc,
                so_luong_kha_dung: tk.so_luong - tk.so_luong_dat_truoc,
            })),
        };
    }

    // ============================================================
    //  GET THỐNG KÊ TỒN KHO (Inventory Stats)
    // ============================================================
    /**
     * Thống kê tồn kho
     *
     * @param idDoanhNghiep - ID doanh nghiệp (multi-tenant)
     * @param khoId - ID kho (optional, để filter theo kho)
     */
    async getStats(idDoanhNghiep: string, khoId?: string) {
        const where: any = {
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };
        if (khoId) {
            where.id_kho = khoId;
        }

        const [tongSanPham, tongSoLuong, sapHetHang, soKho] = await Promise.all([
            // Đếm tổng số sản phẩm có trong kho
            this.prisma.tonKho.count({
                where: { ...where, so_luong: { gt: 0 } },
            }),
            // Tổng số lượng tồn
            this.prisma.tonKho.aggregate({
                where,
                _sum: { so_luong: true },
            }),
            // Số sản phẩm sắp hết (< mức cảnh báo)
            this.prisma.tonKho.count({
                where: {
                    ...where,
                    so_luong: { gt: 0, lte: MUC_CANH_BAO_MAC_DINH },
                },
            }),
            // Số kho
            khoId
                ? 1
                : this.prisma.kho.count({
                    where: {
                        id_doanh_nghiep: idDoanhNghiep,
                        ngay_xoa: null,
                    },
                }),
        ]);

        return {
            tong_san_pham: tongSanPham,
            tong_so_luong: tongSoLuong._sum.so_luong || 0,
            sap_het_hang: sapHetHang,
            so_kho: soKho,
            muc_canh_bao: MUC_CANH_BAO_MAC_DINH,
        };
    }
}
