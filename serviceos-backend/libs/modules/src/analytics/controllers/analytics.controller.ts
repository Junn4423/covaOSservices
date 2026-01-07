/**
 * ============================================================
 * ANALYTICS CONTROLLER - API Endpoints cho Dashboard phan tich
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Phase 15: Analytics Dashboard
 *
 * ENDPOINTS:
 * GET    /analytics/overview          - Thong ke tong quan (doanh thu, khach hang, cong viec, bao gia)
 * GET    /analytics/revenue-chart     - Du lieu bieu do doanh thu theo thang/tuan
 * GET    /analytics/top-selling       - San pham ban chay nhat
 * GET    /analytics/technician-performance - Hieu suat nhan vien ky thuat
 *
 * BAO MAT:
 * - Tat ca endpoints yeu cau xac thuc JWT
 * - Chi Admin moi duoc truy cap module nay (RolesGuard)
 *
 * CACHE:
 * - Overview Stats: TTL 5 phut
 * - Revenue Chart: TTL 10 phut
 * - Top Selling: TTL 5 phut
 * - Technician Performance: TTL 5 phut
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import {
    QueryOverviewStatsDto,
    QueryRevenueChartDto,
    QueryTopSellingDto,
    QueryTechnicianPerformanceDto,
    OverviewStatsResponseDto,
    RevenueChartResponseDto,
    TopSellingProductsResponseDto,
    TechnicianPerformanceResponseDto,
} from '../dto/analytics.dto';
import { JwtAuthGuard, RolesGuard, Roles, TenantId } from '@libs/common';

@ApiTags('Analytics - Dashboard phan tich')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    // ============================================================
    // THONG KE TONG QUAN
    // ============================================================

    @Get('overview')
    @ApiOperation({
        summary: 'Thong ke tong quan Dashboard',
        description:
            'Tra ve cac so lieu tong hop bao gom: ' +
            'Tong doanh thu (tu PhieuThuChi loai THU), ' +
            'So khach hang moi, ' +
            'So cong viec dang thuc hien, ' +
            'So bao gia dang cho xu ly. ' +
            'Du lieu duoc cache trong 5 phut de tang hieu suat.',
    })
    @ApiQuery({
        name: 'tu_ngay',
        required: true,
        description: 'Ngay bat dau khoang thoi gian (YYYY-MM-DD)',
        example: '2026-01-01',
    })
    @ApiQuery({
        name: 'den_ngay',
        required: true,
        description: 'Ngay ket thuc khoang thoi gian (YYYY-MM-DD)',
        example: '2026-01-31',
    })
    @ApiResponse({
        status: 200,
        description: 'Lay thong ke tong quan thanh cong',
        type: OverviewStatsResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Khoang thoi gian khong hop le',
    })
    @ApiResponse({
        status: 401,
        description: 'Chua xac thuc - Token khong hop le hoac het han',
    })
    @ApiResponse({
        status: 403,
        description: 'Khong co quyen truy cap - Yeu cau vai tro Admin',
    })
    getOverviewStats(
        @TenantId() tenantId: string,
        @Query() query: QueryOverviewStatsDto,
    ): Promise<OverviewStatsResponseDto> {
        return this.analyticsService.getOverviewStats(tenantId, query);
    }

    // ============================================================
    // BIEU DO DOANH THU
    // ============================================================

    @Get('revenue-chart')
    @ApiOperation({
        summary: 'Du lieu bieu do doanh thu',
        description:
            'Tra ve du lieu cho bieu do duong (Line Chart) the hien doanh thu theo thoi gian. ' +
            'Ho tro 2 che do: MONTHLY (theo 12 thang) va WEEKLY (theo cac tuan trong nam). ' +
            'Du lieu bao gom labels (nhan truc hoanh) va data (gia tri doanh thu). ' +
            'Du lieu duoc cache trong 10 phut.',
    })
    @ApiQuery({
        name: 'nam',
        required: true,
        description: 'Nam can xem bieu do (VD: 2026)',
        example: 2026,
    })
    @ApiQuery({
        name: 'che_do',
        required: true,
        description: 'Che do hien thi: MONTHLY (theo thang) hoac WEEKLY (theo tuan)',
        enum: ['MONTHLY', 'WEEKLY'],
        example: 'MONTHLY',
    })
    @ApiResponse({
        status: 200,
        description: 'Lay du lieu bieu do doanh thu thanh cong',
        type: RevenueChartResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Tham so khong hop le',
    })
    @ApiResponse({
        status: 401,
        description: 'Chua xac thuc - Token khong hop le hoac het han',
    })
    @ApiResponse({
        status: 403,
        description: 'Khong co quyen truy cap - Yeu cau vai tro Admin',
    })
    getRevenueChart(
        @TenantId() tenantId: string,
        @Query() query: QueryRevenueChartDto,
    ): Promise<RevenueChartResponseDto> {
        return this.analyticsService.getRevenueChart(tenantId, query);
    }

    // ============================================================
    // SAN PHAM BAN CHAY
    // ============================================================

    @Get('top-selling')
    @ApiOperation({
        summary: 'Danh sach san pham ban chay',
        description:
            'Tra ve danh sach san pham ban chay nhat dua tren cac bao gia da duoc khach hang chap nhan (ACCEPTED). ' +
            'Thong tin bao gom: ma san pham, ten, tong so luong ban, tong doanh thu. ' +
            'Mac dinh lay Top 5, co the thay doi qua tham so gioi_han. ' +
            'Du lieu duoc cache trong 5 phut.',
    })
    @ApiQuery({
        name: 'gioi_han',
        required: false,
        description: 'So luong san pham muon lay (mac dinh: 5, toi da: 20)',
        example: 5,
    })
    @ApiQuery({
        name: 'tu_ngay',
        required: false,
        description: 'Ngay bat dau khoang thoi gian loc (YYYY-MM-DD)',
        example: '2026-01-01',
    })
    @ApiQuery({
        name: 'den_ngay',
        required: false,
        description: 'Ngay ket thuc khoang thoi gian loc (YYYY-MM-DD)',
        example: '2026-01-31',
    })
    @ApiResponse({
        status: 200,
        description: 'Lay danh sach san pham ban chay thanh cong',
        type: TopSellingProductsResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Tham so khong hop le',
    })
    @ApiResponse({
        status: 401,
        description: 'Chua xac thuc - Token khong hop le hoac het han',
    })
    @ApiResponse({
        status: 403,
        description: 'Khong co quyen truy cap - Yeu cau vai tro Admin',
    })
    getTopSellingProducts(
        @TenantId() tenantId: string,
        @Query() query: QueryTopSellingDto,
    ): Promise<TopSellingProductsResponseDto> {
        return this.analyticsService.getTopSellingProducts(tenantId, query);
    }

    // ============================================================
    // HIEU SUAT NHAN VIEN
    // ============================================================

    @Get('technician-performance')
    @ApiOperation({
        summary: 'Hieu suat nhan vien ky thuat',
        description:
            'Tra ve danh sach hieu suat lam viec cua nhan vien ky thuat (vai tro: technician, manager). ' +
            'Thong tin bao gom: ho ten, so cong viec hoan thanh, diem danh gia trung binh, so luong danh gia. ' +
            'Ket qua duoc sap xep theo so cong viec hoan thanh giam dan. ' +
            'Du lieu duoc cache trong 5 phut.',
    })
    @ApiQuery({
        name: 'gioi_han',
        required: false,
        description: 'So luong nhan vien muon lay (mac dinh: 10, toi da: 50)',
        example: 10,
    })
    @ApiQuery({
        name: 'tu_ngay',
        required: false,
        description: 'Ngay bat dau khoang thoi gian loc (YYYY-MM-DD)',
        example: '2026-01-01',
    })
    @ApiQuery({
        name: 'den_ngay',
        required: false,
        description: 'Ngay ket thuc khoang thoi gian loc (YYYY-MM-DD)',
        example: '2026-01-31',
    })
    @ApiResponse({
        status: 200,
        description: 'Lay hieu suat nhan vien thanh cong',
        type: TechnicianPerformanceResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Tham so khong hop le',
    })
    @ApiResponse({
        status: 401,
        description: 'Chua xac thuc - Token khong hop le hoac het han',
    })
    @ApiResponse({
        status: 403,
        description: 'Khong co quyen truy cap - Yeu cau vai tro Admin',
    })
    getTechnicianPerformance(
        @TenantId() tenantId: string,
        @Query() query: QueryTechnicianPerformanceDto,
    ): Promise<TechnicianPerformanceResponseDto> {
        return this.analyticsService.getTechnicianPerformance(tenantId, query);
    }
}
