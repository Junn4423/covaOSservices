/**
 * ============================================================
 * ANALYTICS SERVICE - Logic xu ly Dashboard phan tich
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Phase 15: Analytics Dashboard
 *
 * CHUC NANG:
 * - getOverviewStats: Thong ke tong quan (doanh thu, khach hang, cong viec, bao gia)
 * - getRevenueChart: Du lieu bieu do doanh thu theo thang/tuan
 * - getTopSellingProducts: San pham ban chay nhat
 * - getTechnicianPerformance: Hieu suat nhan vien ky thuat
 *
 * TOI UU HOA:
 * - Su dung Prisma groupBy va aggregate de toi uu query
 * - Su dung $queryRaw cho cac query phuc tap
 * - Caching voi TTL 5-10 phut giam tai server
 */

import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '@libs/database';
import { Prisma } from '@prisma/client';
import {
    QueryOverviewStatsDto,
    QueryRevenueChartDto,
    QueryTopSellingDto,
    QueryTechnicianPerformanceDto,
    CheDoBieuDo,
    OverviewStatsResponseDto,
    RevenueChartResponseDto,
    TopSellingProductsResponseDto,
    TechnicianPerformanceResponseDto,
} from '../dto/analytics.dto';

// Cache keys prefix
const CACHE_PREFIX = 'analytics';
// Cache TTL: 5 phut (300 giay)
const CACHE_TTL_SHORT = 300;
// Cache TTL: 10 phut (600 giay)
const CACHE_TTL_LONG = 600;

@Injectable()
export class AnalyticsService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    /**
     * Tao cache key cho tenant
     */
    private getCacheKey(tenantId: string, method: string, params?: string): string {
        const baseKey = `${CACHE_PREFIX}:${tenantId}:${method}`;
        return params ? `${baseKey}:${params}` : baseKey;
    }

    /**
     * Validate khoang thoi gian
     */
    private validateDateRange(tuNgay: string, denNgay: string): void {
        const startDate = new Date(tuNgay);
        const endDate = new Date(denNgay);

        if (startDate > endDate) {
            throw new BadRequestException(
                'Khoang thoi gian khong hop le: Ngay bat dau phai truoc ngay ket thuc',
            );
        }

        // Gioi han khoang thoi gian toi da 1 nam
        const oneYearMs = 365 * 24 * 60 * 60 * 1000;
        if (endDate.getTime() - startDate.getTime() > oneYearMs) {
            throw new BadRequestException(
                'Khoang thoi gian khong hop le: Toi da 1 nam',
            );
        }
    }

    // ============================================================
    // 1. THONG KE TONG QUAN (Overview Stats)
    // ============================================================

    /**
     * Lay thong ke tong quan cho Dashboard
     * - Tong doanh thu (PhieuThuChi loai THU)
     * - Khach hang moi
     * - Cong viec dang thuc hien
     * - Bao gia dang cho
     */
    async getOverviewStats(
        tenantId: string,
        dto: QueryOverviewStatsDto,
    ): Promise<OverviewStatsResponseDto> {
        // Validate khoang thoi gian
        this.validateDateRange(dto.tu_ngay, dto.den_ngay);

        // Tao cache key
        const cacheKey = this.getCacheKey(
            tenantId,
            'overview',
            `${dto.tu_ngay}_${dto.den_ngay}`,
        );

        // Kiem tra cache
        const cached = await this.cacheManager.get<OverviewStatsResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        const startDate = new Date(dto.tu_ngay);
        const endDate = new Date(dto.den_ngay);
        // Dieu chinh endDate den cuoi ngay
        endDate.setHours(23, 59, 59, 999);

        // Thuc hien cac query song song de tang hieu suat
        const [tongDoanhThu, khachHangMoi, congViecDangChay, baoGiaDangCho] =
            await Promise.all([
                // 1. Tong doanh thu: Sum PhieuThuChi loai THU trong khoang thoi gian
                this.prisma.phieuThuChi.aggregate({
                    where: {
                        id_doanh_nghiep: tenantId,
                        loai_phieu: 'thu',
                        ngay_xoa: null,
                        ngay_thuc_hien: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    _sum: {
                        so_tien: true,
                    },
                }),

                // 2. Khach hang moi: Count KhachHang duoc tao trong khoang thoi gian
                this.prisma.khachHang.count({
                    where: {
                        id_doanh_nghiep: tenantId,
                        ngay_xoa: null,
                        ngay_tao: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                }),

                // 3. Cong viec dang chay: trang_thai = 1 (DANG_THUC_HIEN)
                this.prisma.congViec.count({
                    where: {
                        id_doanh_nghiep: tenantId,
                        ngay_xoa: null,
                        trang_thai: 1, // DANG_THUC_HIEN
                    },
                }),

                // 4. Bao gia dang cho: trang_thai = SENT
                this.prisma.baoGia.count({
                    where: {
                        id_doanh_nghiep: tenantId,
                        ngay_xoa: null,
                        trang_thai: 'SENT',
                    },
                }),
            ]);

        const result: OverviewStatsResponseDto = {
            tong_doanh_thu: Number(tongDoanhThu._sum.so_tien || 0),
            khach_hang_moi: khachHangMoi,
            cong_viec_dang_chay: congViecDangChay,
            bao_gia_dang_cho: baoGiaDangCho,
            khoang_thoi_gian: {
                tu_ngay: dto.tu_ngay,
                den_ngay: dto.den_ngay,
            },
        };

        // Luu vao cache
        await this.cacheManager.set(cacheKey, result, CACHE_TTL_SHORT);

        return result;
    }

    // ============================================================
    // 2. BIEU DO DOANH THU (Revenue Chart)
    // ============================================================

    /**
     * Lay du lieu bieu do doanh thu theo thang hoac tuan
     */
    async getRevenueChart(
        tenantId: string,
        dto: QueryRevenueChartDto,
    ): Promise<RevenueChartResponseDto> {
        // Tao cache key
        const cacheKey = this.getCacheKey(
            tenantId,
            'revenue_chart',
            `${dto.nam}_${dto.che_do}`,
        );

        // Kiem tra cache
        const cached = await this.cacheManager.get<RevenueChartResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        let result: RevenueChartResponseDto;

        if (dto.che_do === CheDoBieuDo.MONTHLY) {
            result = await this.getMonthlyRevenueChart(tenantId, dto.nam);
        } else {
            result = await this.getWeeklyRevenueChart(tenantId, dto.nam);
        }

        // Luu vao cache (TTL dai hon vi du lieu theo nam it thay doi)
        await this.cacheManager.set(cacheKey, result, CACHE_TTL_LONG);

        return result;
    }

    /**
     * Lay doanh thu theo thang trong nam
     */
    private async getMonthlyRevenueChart(
        tenantId: string,
        nam: number,
    ): Promise<RevenueChartResponseDto> {
        const startDate = new Date(nam, 0, 1); // 01/01/nam
        const endDate = new Date(nam, 11, 31, 23, 59, 59, 999); // 31/12/nam

        // Su dung $queryRaw de group by thang hieu qua hon
        const monthlyData = await this.prisma.$queryRaw<
            Array<{ thang: number; tong_tien: Prisma.Decimal }>
        >`
            SELECT 
                MONTH(ngay_thuc_hien) as thang,
                COALESCE(SUM(so_tien), 0) as tong_tien
            FROM phieu_thu_chi
            WHERE id_doanh_nghiep = ${tenantId}
                AND loai_phieu = 'thu'
                AND ngay_xoa IS NULL
                AND ngay_thuc_hien >= ${startDate}
                AND ngay_thuc_hien <= ${endDate}
            GROUP BY MONTH(ngay_thuc_hien)
            ORDER BY thang
        `;

        // Khoi tao mang 12 thang voi gia tri 0
        const labels: string[] = [];
        const data: number[] = [];

        for (let i = 1; i <= 12; i++) {
            labels.push(`Thang ${i}`);
            const monthData = monthlyData.find((m) => Number(m.thang) === i);
            data.push(monthData ? Number(monthData.tong_tien) : 0);
        }

        const tongNam = data.reduce((sum, val) => sum + val, 0);

        return {
            labels,
            data,
            nam,
            che_do: CheDoBieuDo.MONTHLY,
            tong_nam: tongNam,
        };
    }

    /**
     * Lay doanh thu theo tuan trong nam
     */
    private async getWeeklyRevenueChart(
        tenantId: string,
        nam: number,
    ): Promise<RevenueChartResponseDto> {
        const startDate = new Date(nam, 0, 1);
        const endDate = new Date(nam, 11, 31, 23, 59, 59, 999);

        // Su dung WEEK function cua MySQL
        const weeklyData = await this.prisma.$queryRaw<
            Array<{ tuan: number; tong_tien: Prisma.Decimal }>
        >`
            SELECT 
                WEEK(ngay_thuc_hien, 1) as tuan,
                COALESCE(SUM(so_tien), 0) as tong_tien
            FROM phieu_thu_chi
            WHERE id_doanh_nghiep = ${tenantId}
                AND loai_phieu = 'thu'
                AND ngay_xoa IS NULL
                AND ngay_thuc_hien >= ${startDate}
                AND ngay_thuc_hien <= ${endDate}
            GROUP BY WEEK(ngay_thuc_hien, 1)
            ORDER BY tuan
        `;

        // Tinh so tuan trong nam (thuong la 52-53)
        const lastDayOfYear = new Date(nam, 11, 31);
        const totalWeeks = this.getWeekNumber(lastDayOfYear);

        const labels: string[] = [];
        const data: number[] = [];

        for (let i = 1; i <= totalWeeks; i++) {
            labels.push(`Tuan ${i}`);
            const weekData = weeklyData.find((w) => Number(w.tuan) === i);
            data.push(weekData ? Number(weekData.tong_tien) : 0);
        }

        const tongNam = data.reduce((sum, val) => sum + val, 0);

        return {
            labels,
            data,
            nam,
            che_do: CheDoBieuDo.WEEKLY,
            tong_nam: tongNam,
        };
    }

    /**
     * Tinh so tuan trong nam cua mot ngay
     */
    private getWeekNumber(date: Date): number {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear =
            (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    // ============================================================
    // 3. SAN PHAM BAN CHAY (Top Selling Products)
    // ============================================================

    /**
     * Lay danh sach san pham ban chay nhat
     * Dua tren ChiTietBaoGia (bao gia da duoc chap nhan)
     */
    async getTopSellingProducts(
        tenantId: string,
        dto: QueryTopSellingDto,
    ): Promise<TopSellingProductsResponseDto> {
        const limit = dto.gioi_han || 5;

        // Validate khoang thoi gian neu co
        if (dto.tu_ngay && dto.den_ngay) {
            this.validateDateRange(dto.tu_ngay, dto.den_ngay);
        }

        // Tao cache key
        const cacheKey = this.getCacheKey(
            tenantId,
            'top_selling',
            `${limit}_${dto.tu_ngay || 'all'}_${dto.den_ngay || 'all'}`,
        );

        // Kiem tra cache
        const cached =
            await this.cacheManager.get<TopSellingProductsResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        // Xay dung dieu kien where
        let dateCondition = '';
        if (dto.tu_ngay && dto.den_ngay) {
            const startDate = new Date(dto.tu_ngay);
            const endDate = new Date(dto.den_ngay);
            endDate.setHours(23, 59, 59, 999);
            dateCondition = `AND bg.ngay_bao_gia >= '${startDate.toISOString()}' AND bg.ngay_bao_gia <= '${endDate.toISOString()}'`;
        }

        // Query san pham ban chay tu ChiTietBaoGia (chi tinh bao gia ACCEPTED)
        const topProducts = await this.prisma.$queryRaw<
            Array<{
                id: string;
                ma_san_pham: string | null;
                ten_san_pham: string;
                tong_so_luong: bigint;
                tong_doanh_thu: Prisma.Decimal;
            }>
        >`
            SELECT 
                sp.id,
                sp.ma_san_pham,
                sp.ten_san_pham,
                COALESCE(SUM(ctbg.so_luong), 0) as tong_so_luong,
                COALESCE(SUM(ctbg.thanh_tien), 0) as tong_doanh_thu
            FROM san_pham sp
            INNER JOIN chi_tiet_bao_gia ctbg ON sp.id = ctbg.id_san_pham
            INNER JOIN bao_gia bg ON ctbg.id_bao_gia = bg.id
            WHERE sp.id_doanh_nghiep = ${tenantId}
                AND sp.ngay_xoa IS NULL
                AND ctbg.ngay_xoa IS NULL
                AND bg.ngay_xoa IS NULL
                AND bg.trang_thai = 'ACCEPTED'
            GROUP BY sp.id, sp.ma_san_pham, sp.ten_san_pham
            ORDER BY tong_so_luong DESC
            LIMIT ${limit}
        `;

        const sanPham = topProducts.map((item, index) => ({
            id: item.id,
            ma_san_pham: item.ma_san_pham || '',
            ten_san_pham: item.ten_san_pham,
            tong_so_luong: Number(item.tong_so_luong),
            tong_doanh_thu: Number(item.tong_doanh_thu),
            thu_tu: index + 1,
        }));

        const result: TopSellingProductsResponseDto = {
            san_pham: sanPham,
            khoang_thoi_gian:
                dto.tu_ngay && dto.den_ngay
                    ? { tu_ngay: dto.tu_ngay, den_ngay: dto.den_ngay }
                    : undefined,
        };

        // Luu vao cache
        await this.cacheManager.set(cacheKey, result, CACHE_TTL_SHORT);

        return result;
    }

    // ============================================================
    // 4. HIEU SUAT NHAN VIEN (Technician Performance)
    // ============================================================

    /**
     * Lay hieu suat nhan vien ky thuat
     * - So cong viec hoan thanh
     * - Diem danh gia trung binh
     */
    async getTechnicianPerformance(
        tenantId: string,
        dto: QueryTechnicianPerformanceDto,
    ): Promise<TechnicianPerformanceResponseDto> {
        const limit = dto.gioi_han || 10;

        // Validate khoang thoi gian neu co
        if (dto.tu_ngay && dto.den_ngay) {
            this.validateDateRange(dto.tu_ngay, dto.den_ngay);
        }

        // Tao cache key
        const cacheKey = this.getCacheKey(
            tenantId,
            'technician_performance',
            `${limit}_${dto.tu_ngay || 'all'}_${dto.den_ngay || 'all'}`,
        );

        // Kiem tra cache
        const cached =
            await this.cacheManager.get<TechnicianPerformanceResponseDto>(cacheKey);
        if (cached) {
            return cached;
        }

        // Xay dung dieu kien ngay cho cong viec
        let dateConditionCV = '';
        let dateConditionDG = '';
        if (dto.tu_ngay && dto.den_ngay) {
            const startDate = new Date(dto.tu_ngay);
            const endDate = new Date(dto.den_ngay);
            endDate.setHours(23, 59, 59, 999);
            const startStr = startDate.toISOString().slice(0, 19).replace('T', ' ');
            const endStr = endDate.toISOString().slice(0, 19).replace('T', ' ');
            dateConditionCV = `AND cv.ngay_hoan_thanh >= '${startStr}' AND cv.ngay_hoan_thanh <= '${endStr}'`;
            dateConditionDG = `AND dg.ngay_tao >= '${startStr}' AND dg.ngay_tao <= '${endStr}'`;
        }

        // Query hieu suat nhan vien (vai_tro = 'technician' hoac 'staff')
        // Dem cong viec hoan thanh (trang_thai = 2) qua bang PhanCong
        const performanceData = await this.prisma.$queryRaw<
            Array<{
                id: string;
                ho_ten: string;
                cong_viec_hoan_thanh: bigint;
                diem_danh_gia_tb: Prisma.Decimal | null;
                so_luong_danh_gia: bigint;
            }>
        >`
            SELECT 
                nd.id,
                nd.ho_ten,
                COUNT(DISTINCT CASE WHEN cv.trang_thai = 2 THEN cv.id END) as cong_viec_hoan_thanh,
                AVG(dg.so_sao) as diem_danh_gia_tb,
                COUNT(DISTINCT dg.id) as so_luong_danh_gia
            FROM nguoi_dung nd
            LEFT JOIN phan_cong pc ON nd.id = pc.id_nguoi_dung AND pc.ngay_xoa IS NULL
            LEFT JOIN cong_viec cv ON pc.id_cong_viec = cv.id AND cv.ngay_xoa IS NULL
            LEFT JOIN danh_gia dg ON cv.id = dg.id_cong_viec AND dg.ngay_xoa IS NULL
            WHERE nd.id_doanh_nghiep = ${tenantId}
                AND nd.ngay_xoa IS NULL
                AND nd.vai_tro IN ('technician', 'manager')
            GROUP BY nd.id, nd.ho_ten
            ORDER BY cong_viec_hoan_thanh DESC
            LIMIT ${limit}
        `;

        const nhanVien = performanceData.map((item, index) => ({
            id: item.id,
            ho_ten: item.ho_ten,
            cong_viec_hoan_thanh: Number(item.cong_viec_hoan_thanh),
            diem_danh_gia_tb: item.diem_danh_gia_tb
                ? Number(Number(item.diem_danh_gia_tb).toFixed(1))
                : null,
            so_luong_danh_gia: Number(item.so_luong_danh_gia),
            thu_tu: index + 1,
        }));

        // Tinh thong ke tong hop
        const tongCongViecHoanThanh = nhanVien.reduce(
            (sum, nv) => sum + nv.cong_viec_hoan_thanh,
            0,
        );

        const diemDanhGiaArr = nhanVien
            .filter((nv) => nv.diem_danh_gia_tb !== null)
            .map((nv) => nv.diem_danh_gia_tb as number);

        const diemDanhGiaTbChung =
            diemDanhGiaArr.length > 0
                ? Number(
                      (
                          diemDanhGiaArr.reduce((sum, d) => sum + d, 0) /
                          diemDanhGiaArr.length
                      ).toFixed(1),
                  )
                : null;

        const result: TechnicianPerformanceResponseDto = {
            nhan_vien: nhanVien,
            thong_ke: {
                tong_nhan_vien: nhanVien.length,
                tong_cong_viec_hoan_thanh: tongCongViecHoanThanh,
                diem_danh_gia_tb_chung: diemDanhGiaTbChung,
            },
            khoang_thoi_gian:
                dto.tu_ngay && dto.den_ngay
                    ? { tu_ngay: dto.tu_ngay, den_ngay: dto.den_ngay }
                    : undefined,
        };

        // Luu vao cache
        await this.cacheManager.set(cacheKey, result, CACHE_TTL_SHORT);

        return result;
    }

    // ============================================================
    // CACHE MANAGEMENT
    // ============================================================

    /**
     * Xoa cache analytics cua mot tenant
     * Goi khi co thay doi du lieu anh huong den bao cao
     */
    async clearTenantCache(tenantId: string): Promise<void> {
        const methods = [
            'overview',
            'revenue_chart',
            'top_selling',
            'technician_performance',
        ];

        // Xoa tat ca cache lien quan den tenant
        for (const method of methods) {
            const pattern = `${CACHE_PREFIX}:${tenantId}:${method}`;
            // Note: Viec xoa theo pattern phu thuoc vao cache store (Redis ho tro tot hon)
            // Voi in-memory cache, co the can implement khac
            await this.cacheManager.del(pattern);
        }
    }
}
