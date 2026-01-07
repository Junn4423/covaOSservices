/**
 * ============================================================
 * BILLING SERVICE - Quản lý Gói cước SaaS
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Phase 14: Quản lý Gói cước SaaS
 *
 * CHỨC NĂNG:
 * 1. getCurrentSubscription - Lấy thông tin gói cước hiện tại
 * 2. upgradeSubscription - Nâng cấp gói cước
 * 3. cancelSubscription - Hủy tự động gia hạn
 * 4. getBillingHistory - Lịch sử thanh toán
 * 5. createManualPayment - Tạo thanh toán thủ công (Admin)
 * 6. checkAndLockExpiredTenants - Khóa tenant hết hạn
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import {
    UpgradeSubscriptionDto,
    CancelSubscriptionDto,
    ManualPaymentDto,
    QueryBillingHistoryDto,
    GoiCuocEnum,
    ChuKyThanhToanEnum,
    TrangThaiThanhToan,
    billingDecimalToNumber,
    SubscriptionInfoResponse,
} from '../dto/billing.dto';

// ============================================================
// GIÁ GÓI CƯỚC (Ví dụ - có thể cấu hình trong database sau)
// ============================================================
const PRICING_CONFIG = {
    [GoiCuocEnum.TRIAL]: {
        [ChuKyThanhToanEnum.THANG]: 0,
        [ChuKyThanhToanEnum.NAM]: 0,
    },
    [GoiCuocEnum.BASIC]: {
        [ChuKyThanhToanEnum.THANG]: 500000,
        [ChuKyThanhToanEnum.NAM]: 5000000,
    },
    [GoiCuocEnum.PRO]: {
        [ChuKyThanhToanEnum.THANG]: 1500000,
        [ChuKyThanhToanEnum.NAM]: 15000000,
    },
    [GoiCuocEnum.ENTERPRISE]: {
        [ChuKyThanhToanEnum.THANG]: 5000000,
        [ChuKyThanhToanEnum.NAM]: 50000000,
    },
};

@Injectable()
export class BillingService {
    private readonly logger = new Logger(BillingService.name);

    constructor(private readonly prisma: PrismaService) {}

    // ============================================================
    // 1. LẤY THÔNG TIN GÓI CƯỚC HIỆN TẠI
    // ============================================================

    /**
     * Lấy thông tin gói cước hiện tại của tenant
     */
    async getCurrentSubscription(idDoanhNghiep: string): Promise<SubscriptionInfoResponse> {
        const doanhNghiep = await this.prisma.doanhNghiep.findUnique({
            where: { id: idDoanhNghiep },
            select: {
                id: true,
                ten_doanh_nghiep: true,
                goi_cuoc: true,
                ngay_het_han_goi: true,
                trang_thai: true,
            },
        });

        if (!doanhNghiep) {
            throw new NotFoundException('Không tìm thấy doanh nghiệp');
        }

        // Tính số ngày còn lại
        let soNgayConLai: number | null = null;
        let daHetHan = false;

        if (doanhNghiep.ngay_het_han_goi) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const ngayHetHan = new Date(doanhNghiep.ngay_het_han_goi);
            ngayHetHan.setHours(0, 0, 0, 0);
            
            const diffTime = ngayHetHan.getTime() - today.getTime();
            soNgayConLai = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            daHetHan = soNgayConLai < 0;
        }

        return {
            id_doanh_nghiep: doanhNghiep.id,
            ten_doanh_nghiep: doanhNghiep.ten_doanh_nghiep,
            goi_cuoc: doanhNghiep.goi_cuoc as GoiCuocEnum,
            trang_thai: doanhNghiep.trang_thai,
            ngay_het_han_goi: doanhNghiep.ngay_het_han_goi,
            so_ngay_con_lai: soNgayConLai,
            da_het_han: daHetHan,
        };
    }

    // ============================================================
    // 2. NÂNG CẤP GÓI CƯỚC
    // ============================================================

    /**
     * Nâng cấp gói cước
     * - Mô phỏng thanh toán qua cổng (chưa tích hợp Stripe)
     * - Cập nhật gói cước cho doanh nghiệp
     * - Tính ngày hết hạn mới
     * - Tạo bản ghi thanh toán
     */
    async upgradeSubscription(
        idDoanhNghiep: string,
        dto: UpgradeSubscriptionDto,
        nguoiThucHienId?: string,
    ) {
        const { goi_cuoc_moi, chu_ky } = dto;

        // 1. Lấy thông tin doanh nghiệp hiện tại
        const doanhNghiep = await this.prisma.doanhNghiep.findUnique({
            where: { id: idDoanhNghiep },
            select: {
                id: true,
                ten_doanh_nghiep: true,
                goi_cuoc: true,
                ngay_het_han_goi: true,
                trang_thai: true,
            },
        });

        if (!doanhNghiep) {
            throw new NotFoundException('Không tìm thấy doanh nghiệp');
        }

        // 2. Tính giá tiền
        const giaTien = PRICING_CONFIG[goi_cuoc_moi]?.[chu_ky] ?? 0;

        // 3. Mô phỏng thanh toán cổng (luôn thành công)
        this.logger.log(
            `[MÔ PHỎNG THANH TOÁN] Doanh nghiệp: ${doanhNghiep.ten_doanh_nghiep}, ` +
            `Gói cước: ${goi_cuoc_moi}, Chu kỳ: ${chu_ky}, Số tiền: ${giaTien} VND`
        );
        const paymentSuccess = true; // Giả lập thành công

        if (!paymentSuccess) {
            throw new BadRequestException('Thanh toán thất bại. Vui lòng thử lại sau.');
        }

        // 4. Tính ngày bắt đầu và kết thúc
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let tuNgay: Date;
        let denNgay: Date;

        // Nếu gói hiện tại còn hạn, cộng dồn thời gian
        if (doanhNghiep.ngay_het_han_goi && new Date(doanhNghiep.ngay_het_han_goi) > today) {
            tuNgay = new Date(doanhNghiep.ngay_het_han_goi);
        } else {
            tuNgay = today;
        }

        // Tính ngày kết thúc dựa trên chu kỳ
        denNgay = new Date(tuNgay);
        if (chu_ky === ChuKyThanhToanEnum.NAM) {
            denNgay.setFullYear(denNgay.getFullYear() + 1);
        } else {
            denNgay.setMonth(denNgay.getMonth() + 1);
        }

        // 5. Transaction: Cập nhật doanh nghiệp + Tạo bản ghi thanh toán
        const result = await this.prisma.$transaction(async (tx) => {
            // 5.1 Cập nhật doanh nghiệp
            const updatedDoanhNghiep = await tx.doanhNghiep.update({
                where: { id: idDoanhNghiep },
                data: {
                    goi_cuoc: goi_cuoc_moi,
                    ngay_het_han_goi: denNgay,
                    trang_thai: 1, // Kích hoạt lại nếu bị khóa
                    nguoi_cap_nhat_id: nguoiThucHienId,
                },
            });

            // 5.2 Sinh mã hóa đơn
            const maHoaDon = await this.generateMaHoaDon(tx, idDoanhNghiep);

            // 5.3 Tạo bản ghi thanh toán
            const thanhToan = await tx.thanhToanSaas.create({
                data: {
                    id: uuidv4(),
                    id_doanh_nghiep: idDoanhNghiep,
                    ma_hoa_don: maHoaDon,
                    so_tien: giaTien,
                    loai_tien: 'VND',
                    goi_cuoc: goi_cuoc_moi,
                    chu_ky: chu_ky,
                    tu_ngay: tuNgay,
                    den_ngay: denNgay,
                    phuong_thuc: 'gateway',
                    ma_giao_dich_cong: `SIM-${Date.now()}`,
                    trang_thai: TrangThaiThanhToan.THANH_CONG,
                    ngay_thanh_toan: new Date(),
                    ghi_chu: `Nâng cấp gói cước lên ${goi_cuoc_moi.toUpperCase()} - ${chu_ky === ChuKyThanhToanEnum.NAM ? '12 tháng' : '1 tháng'}`,
                    nguoi_tao_id: nguoiThucHienId,
                },
            });

            return { doanhNghiep: updatedDoanhNghiep, thanhToan };
        });

        this.logger.log(
            `[NÂNG CẤP THÀNH CÔNG] Doanh nghiệp ${doanhNghiep.ten_doanh_nghiep} ` +
            `đã nâng cấp lên gói ${goi_cuoc_moi.toUpperCase()}`
        );

        return {
            message: 'Đã nâng cấp gói cước thành công',
            data: {
                goi_cuoc_cu: doanhNghiep.goi_cuoc,
                goi_cuoc_moi: goi_cuoc_moi,
                chu_ky: chu_ky,
                so_tien: giaTien,
                tu_ngay: tuNgay,
                den_ngay: denNgay,
                ma_hoa_don: result.thanhToan.ma_hoa_don,
            },
        };
    }

    // ============================================================
    // 3. HỦY TỰ ĐỘNG GIA HẠN
    // ============================================================

    /**
     * Hủy tự động gia hạn gói cước
     * - Ghi nhận yêu cầu hủy
     * - Gói cước vẫn còn hiệu lực đến ngày hết hạn
     */
    async cancelSubscription(
        idDoanhNghiep: string,
        dto: CancelSubscriptionDto,
        nguoiThucHienId?: string,
    ) {
        const doanhNghiep = await this.prisma.doanhNghiep.findUnique({
            where: { id: idDoanhNghiep },
            select: {
                id: true,
                ten_doanh_nghiep: true,
                goi_cuoc: true,
                ngay_het_han_goi: true,
                cau_hinh_json: true,
            },
        });

        if (!doanhNghiep) {
            throw new NotFoundException('Không tìm thấy doanh nghiệp');
        }

        // Cập nhật cấu hình - tắt auto_renew
        const cauHinhHienTai = (doanhNghiep.cau_hinh_json as Record<string, any>) || {};
        const cauHinhMoi = {
            ...cauHinhHienTai,
            auto_renew: false,
            cancel_reason: dto.ly_do || 'Không rõ lý do',
            cancel_date: new Date().toISOString(),
            cancel_by: nguoiThucHienId,
        };

        await this.prisma.doanhNghiep.update({
            where: { id: idDoanhNghiep },
            data: {
                cau_hinh_json: cauHinhMoi,
                nguoi_cap_nhat_id: nguoiThucHienId,
            },
        });

        this.logger.log(
            `[HỦY GÓI CƯỚC] Doanh nghiệp: ${doanhNghiep.ten_doanh_nghiep}, ` +
            `Lý do: ${dto.ly_do || 'Không rõ'}`
        );

        return {
            message: 'Đã hủy tự động gia hạn gói cước',
            data: {
                ten_doanh_nghiep: doanhNghiep.ten_doanh_nghiep,
                goi_cuoc_hien_tai: doanhNghiep.goi_cuoc,
                ngay_het_han: doanhNghiep.ngay_het_han_goi,
                ghi_chu: 'Gói cước sẽ hết hiệu lực vào ngày hết hạn. Sau đó tài khoản sẽ bị khóa.',
            },
        };
    }

    // ============================================================
    // 4. LỊCH SỬ THANH TOÁN
    // ============================================================

    /**
     * Lấy lịch sử thanh toán của doanh nghiệp
     */
    async getBillingHistory(idDoanhNghiep: string, query: QueryBillingHistoryDto) {
        const { tu_ngay, den_ngay, trang_thai, page = 1, limit = 20 } = query;

        // Build where clause
        const where: any = {
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        if (tu_ngay) {
            where.tu_ngay = { gte: new Date(tu_ngay) };
        }

        if (den_ngay) {
            where.den_ngay = { lte: new Date(den_ngay) };
        }

        if (trang_thai !== undefined && trang_thai !== null) {
            where.trang_thai = trang_thai;
        }

        // Query with pagination
        const [items, total] = await Promise.all([
            this.prisma.thanhToanSaas.findMany({
                where,
                orderBy: { ngay_tao: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.thanhToanSaas.count({ where }),
        ]);

        // Transform decimal values
        const transformedItems = items.map((item) => ({
            ...item,
            so_tien: billingDecimalToNumber(item.so_tien),
        }));

        return {
            data: transformedItems,
            pagination: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // 5. TẠO THANH TOÁN THỦ CÔNG (Admin)
    // ============================================================

    /**
     * Tạo thanh toán thủ công (B2B chuyển khoản ngân hàng)
     * Chỉ dành cho Admin hệ thống
     */
    async createManualPayment(dto: ManualPaymentDto, nguoiThucHienId?: string) {
        const {
            id_doanh_nghiep,
            so_tien,
            loai_tien,
            phuong_thuc,
            ma_giao_dich,
            ghi_chu,
            goi_cuoc,
            chu_ky,
        } = dto;

        // 1. Kiểm tra doanh nghiệp tồn tại
        const doanhNghiep = await this.prisma.doanhNghiep.findUnique({
            where: { id: id_doanh_nghiep },
            select: {
                id: true,
                ten_doanh_nghiep: true,
                ngay_het_han_goi: true,
            },
        });

        if (!doanhNghiep) {
            throw new NotFoundException(`Không tìm thấy doanh nghiệp với ID: ${id_doanh_nghiep}`);
        }

        // 2. Tính ngày bắt đầu và kết thúc
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let tuNgay: Date;
        let denNgay: Date;

        if (doanhNghiep.ngay_het_han_goi && new Date(doanhNghiep.ngay_het_han_goi) > today) {
            tuNgay = new Date(doanhNghiep.ngay_het_han_goi);
        } else {
            tuNgay = today;
        }

        denNgay = new Date(tuNgay);
        if (chu_ky === ChuKyThanhToanEnum.NAM) {
            denNgay.setFullYear(denNgay.getFullYear() + 1);
        } else {
            denNgay.setMonth(denNgay.getMonth() + 1);
        }

        // 3. Transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // 3.1 Cập nhật doanh nghiệp
            await tx.doanhNghiep.update({
                where: { id: id_doanh_nghiep },
                data: {
                    goi_cuoc: goi_cuoc,
                    ngay_het_han_goi: denNgay,
                    trang_thai: 1,
                    nguoi_cap_nhat_id: nguoiThucHienId,
                },
            });

            // 3.2 Sinh mã hóa đơn
            const maHoaDon = await this.generateMaHoaDon(tx, id_doanh_nghiep);

            // 3.3 Tạo bản ghi thanh toán
            const thanhToan = await tx.thanhToanSaas.create({
                data: {
                    id: uuidv4(),
                    id_doanh_nghiep: id_doanh_nghiep,
                    ma_hoa_don: maHoaDon,
                    so_tien: so_tien,
                    loai_tien: loai_tien,
                    goi_cuoc: goi_cuoc,
                    chu_ky: chu_ky,
                    tu_ngay: tuNgay,
                    den_ngay: denNgay,
                    phuong_thuc: phuong_thuc,
                    ma_giao_dich_cong: ma_giao_dich,
                    trang_thai: TrangThaiThanhToan.THANH_CONG,
                    ngay_thanh_toan: new Date(),
                    ghi_chu: ghi_chu || `Thanh toán thủ công - ${phuong_thuc}`,
                    nguoi_tao_id: nguoiThucHienId,
                },
            });

            return thanhToan;
        });

        this.logger.log(
            `[THANH TOÁN THỦ CÔNG] Doanh nghiệp: ${doanhNghiep.ten_doanh_nghiep}, ` +
            `Số tiền: ${so_tien} ${loai_tien}, Mã GD: ${ma_giao_dich || 'N/A'}`
        );

        return {
            message: 'Đã tạo thanh toán thủ công thành công',
            data: {
                id: result.id,
                ma_hoa_don: result.ma_hoa_don,
                ten_doanh_nghiep: doanhNghiep.ten_doanh_nghiep,
                so_tien: billingDecimalToNumber(result.so_tien),
                loai_tien: result.loai_tien,
                goi_cuoc: result.goi_cuoc,
                tu_ngay: result.tu_ngay,
                den_ngay: result.den_ngay,
            },
        };
    }

    // ============================================================
    // 6. KIỂM TRA VÀ KHÓA TENANT HẾT HẠN
    // ============================================================

    /**
     * Kiểm tra và khóa các doanh nghiệp hết hạn gói cước
     * - Tìm các DN có ngay_het_han_goi < NOW() và trang_thai = 1
     * - Cập nhật trang_thai = 2 (LOCKED/SUSPENDED)
     *
     * Phương thức này nên được gọi bởi:
     * - Cron Job (chạy hàng ngày)
     * - Admin API endpoint (thủ công)
     */
    async checkAndLockExpiredTenants(): Promise<{
        message: string;
        so_tenant_bi_khoa: number;
        danh_sach: Array<{ id: string; ten: string; ngay_het_han: Date }>;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Tìm các doanh nghiệp hết hạn
        const expiredTenants = await this.prisma.doanhNghiep.findMany({
            where: {
                ngay_het_han_goi: { lt: today },
                trang_thai: 1, // Đang hoạt động
                ngay_xoa: null,
            },
            select: {
                id: true,
                ten_doanh_nghiep: true,
                ngay_het_han_goi: true,
            },
        });

        if (expiredTenants.length === 0) {
            return {
                message: 'Không có doanh nghiệp nào hết hạn cần khóa',
                so_tenant_bi_khoa: 0,
                danh_sach: [],
            };
        }

        // Khóa tất cả các tenant hết hạn
        const idsToLock = expiredTenants.map((t) => t.id);

        await this.prisma.doanhNghiep.updateMany({
            where: { id: { in: idsToLock } },
            data: { trang_thai: 2 }, // LOCKED
        });

        this.logger.warn(
            `[TENANT HẾT HẠN] Đã khóa ${expiredTenants.length} doanh nghiệp hết hạn gói cước`
        );

        return {
            message: `Đã khóa ${expiredTenants.length} doanh nghiệp hết hạn gói cước`,
            so_tenant_bi_khoa: expiredTenants.length,
            danh_sach: expiredTenants.map((t) => ({
                id: t.id,
                ten: t.ten_doanh_nghiep,
                ngay_het_han: t.ngay_het_han_goi!,
            })),
        };
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    /**
     * Sinh mã hóa đơn tự động: INV-YYYY-XXXX
     */
    private async generateMaHoaDon(
        tx: any,
        idDoanhNghiep: string,
    ): Promise<string> {
        const year = new Date().getFullYear();
        const count = await tx.thanhToanSaas.count({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                ngay_tao: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            },
        });
        return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    /**
     * Lấy giá gói cước
     */
    getPricing() {
        return {
            message: 'Bảng giá gói cước ServiceOS',
            data: Object.entries(PRICING_CONFIG).map(([goiCuoc, prices]) => ({
                goi_cuoc: goiCuoc,
                gia_thang: prices[ChuKyThanhToanEnum.THANG],
                gia_nam: prices[ChuKyThanhToanEnum.NAM],
                tiet_kiem_nam: prices[ChuKyThanhToanEnum.THANG] * 12 - prices[ChuKyThanhToanEnum.NAM],
            })),
        };
    }
}
