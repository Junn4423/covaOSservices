/**
 * ============================================================
 * ANALYTICS DTOs - Data Transfer Objects cho Dashboard
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Phase 15: Analytics Dashboard
 *
 * DTOs cho module Analytics bao gom:
 * - QueryOverviewStatsDto: Tham so truy van tong quan
 * - QueryRevenueChartDto: Tham so bieu do doanh thu
 * - OverviewStatsResponseDto: Ket qua thong ke tong quan
 * - RevenueChartResponseDto: Du lieu bieu do doanh thu
 * - TopSellingProductDto: San pham ban chay
 * - TechnicianPerformanceDto: Hieu suat nhan vien
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    Max,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Che do hien thi bieu do doanh thu
 */
export enum CheDoBieuDo {
    MONTHLY = 'MONTHLY',
    WEEKLY = 'WEEKLY',
}

// ============================================================
// INPUT DTOs
// ============================================================

/**
 * DTO truy van thong ke tong quan
 */
export class QueryOverviewStatsDto {
    @ApiProperty({
        description: 'Ngay bat dau khoang thoi gian thong ke (YYYY-MM-DD)',
        example: '2026-01-01',
    })
    @IsDateString({}, { message: 'Ngay bat dau khong dung dinh dang (YYYY-MM-DD)' })
    tu_ngay: string;

    @ApiProperty({
        description: 'Ngay ket thuc khoang thoi gian thong ke (YYYY-MM-DD)',
        example: '2026-01-31',
    })
    @IsDateString({}, { message: 'Ngay ket thuc khong dung dinh dang (YYYY-MM-DD)' })
    den_ngay: string;
}

/**
 * DTO truy van bieu do doanh thu
 */
export class QueryRevenueChartDto {
    @ApiProperty({
        description: 'Nam can xem bieu do (VD: 2026)',
        example: 2026,
        minimum: 2020,
        maximum: 2100,
    })
    @Type(() => Number)
    @IsInt({ message: 'Nam phai la so nguyen' })
    @Min(2020, { message: 'Nam phai lon hon hoac bang 2020' })
    @Max(2100, { message: 'Nam phai nho hon hoac bang 2100' })
    nam: number;

    @ApiProperty({
        description: 'Che do hien thi: MONTHLY (theo thang) hoac WEEKLY (theo tuan)',
        enum: CheDoBieuDo,
        example: CheDoBieuDo.MONTHLY,
    })
    @IsEnum(CheDoBieuDo, { message: 'Che do phai la MONTHLY hoac WEEKLY' })
    che_do: CheDoBieuDo;
}

/**
 * DTO truy van san pham ban chay
 */
export class QueryTopSellingDto {
    @ApiPropertyOptional({
        description: 'So luong san pham muon lay (mac dinh: 5)',
        example: 5,
        minimum: 1,
        maximum: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Gioi han phai la so nguyen' })
    @Min(1, { message: 'Gioi han toi thieu la 1' })
    @Max(20, { message: 'Gioi han toi da la 20' })
    gioi_han?: number = 5;

    @ApiPropertyOptional({
        description: 'Ngay bat dau khoang thoi gian (YYYY-MM-DD)',
        example: '2026-01-01',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay bat dau khong dung dinh dang (YYYY-MM-DD)' })
    tu_ngay?: string;

    @ApiPropertyOptional({
        description: 'Ngay ket thuc khoang thoi gian (YYYY-MM-DD)',
        example: '2026-01-31',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay ket thuc khong dung dinh dang (YYYY-MM-DD)' })
    den_ngay?: string;
}

/**
 * DTO truy van hieu suat nhan vien
 */
export class QueryTechnicianPerformanceDto {
    @ApiPropertyOptional({
        description: 'Ngay bat dau khoang thoi gian (YYYY-MM-DD)',
        example: '2026-01-01',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay bat dau khong dung dinh dang (YYYY-MM-DD)' })
    tu_ngay?: string;

    @ApiPropertyOptional({
        description: 'Ngay ket thuc khoang thoi gian (YYYY-MM-DD)',
        example: '2026-01-31',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay ket thuc khong dung dinh dang (YYYY-MM-DD)' })
    den_ngay?: string;

    @ApiPropertyOptional({
        description: 'So luong nhan vien muon lay (mac dinh: 10)',
        example: 10,
        minimum: 1,
        maximum: 50,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Gioi han phai la so nguyen' })
    @Min(1, { message: 'Gioi han toi thieu la 1' })
    @Max(50, { message: 'Gioi han toi da la 50' })
    gioi_han?: number = 10;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Ket qua thong ke tong quan Dashboard
 */
export class OverviewStatsResponseDto {
    @ApiProperty({
        description: 'Tong doanh thu trong khoang thoi gian (VND)',
        example: 150000000,
    })
    tong_doanh_thu: number;

    @ApiProperty({
        description: 'So luong khach hang moi trong khoang thoi gian',
        example: 25,
    })
    khach_hang_moi: number;

    @ApiProperty({
        description: 'So luong cong viec dang thuc hien',
        example: 12,
    })
    cong_viec_dang_chay: number;

    @ApiProperty({
        description: 'So luong bao gia dang cho xu ly',
        example: 8,
    })
    bao_gia_dang_cho: number;

    @ApiProperty({
        description: 'Khoang thoi gian thong ke',
        example: { tu_ngay: '2026-01-01', den_ngay: '2026-01-31' },
    })
    khoang_thoi_gian: {
        tu_ngay: string;
        den_ngay: string;
    };
}

/**
 * Du lieu cho bieu do doanh thu (Line Chart)
 */
export class RevenueChartResponseDto {
    @ApiProperty({
        description: 'Nhan truc hoanh (thang hoac tuan)',
        example: ['Thang 1', 'Thang 2', 'Thang 3'],
    })
    labels: string[];

    @ApiProperty({
        description: 'Du lieu doanh thu tuong ung voi nhan (VND)',
        example: [50000000, 75000000, 120000000],
    })
    data: number[];

    @ApiProperty({
        description: 'Nam du lieu',
        example: 2026,
    })
    nam: number;

    @ApiProperty({
        description: 'Che do hien thi',
        example: 'MONTHLY',
    })
    che_do: string;

    @ApiProperty({
        description: 'Tong doanh thu trong nam',
        example: 1500000000,
    })
    tong_nam: number;
}

/**
 * Thong tin san pham ban chay
 */
export class TopSellingProductDto {
    @ApiProperty({
        description: 'ID san pham',
        example: 'uuid-san-pham',
    })
    id: string;

    @ApiProperty({
        description: 'Ma san pham',
        example: 'SP001',
    })
    ma_san_pham: string;

    @ApiProperty({
        description: 'Ten san pham',
        example: 'Dich vu sua chua dieu hoa',
    })
    ten_san_pham: string;

    @ApiProperty({
        description: 'Tong so luong da ban',
        example: 150,
    })
    tong_so_luong: number;

    @ApiProperty({
        description: 'Tong doanh thu tu san pham (VND)',
        example: 75000000,
    })
    tong_doanh_thu: number;

    @ApiProperty({
        description: 'Thu tu xep hang',
        example: 1,
    })
    thu_tu: number;
}

/**
 * Response danh sach san pham ban chay
 */
export class TopSellingProductsResponseDto {
    @ApiProperty({
        description: 'Danh sach san pham ban chay',
        type: [TopSellingProductDto],
    })
    san_pham: TopSellingProductDto[];

    @ApiProperty({
        description: 'Khoang thoi gian thong ke (neu co)',
    })
    khoang_thoi_gian?: {
        tu_ngay: string;
        den_ngay: string;
    };
}

/**
 * Thong tin hieu suat nhan vien ky thuat
 */
export class TechnicianPerformanceDto {
    @ApiProperty({
        description: 'ID nhan vien',
        example: 'uuid-nhan-vien',
    })
    id: string;

    @ApiProperty({
        description: 'Ho ten nhan vien',
        example: 'Nguyen Van A',
    })
    ho_ten: string;

    @ApiProperty({
        description: 'So luong cong viec da hoan thanh',
        example: 45,
    })
    cong_viec_hoan_thanh: number;

    @ApiProperty({
        description: 'Diem danh gia trung binh (1-5)',
        example: 4.5,
    })
    diem_danh_gia_tb: number | null;

    @ApiProperty({
        description: 'So luong danh gia',
        example: 30,
    })
    so_luong_danh_gia: number;

    @ApiProperty({
        description: 'Thu tu xep hang theo hieu suat',
        example: 1,
    })
    thu_tu: number;
}

/**
 * Response hieu suat nhan vien
 */
export class TechnicianPerformanceResponseDto {
    @ApiProperty({
        description: 'Danh sach hieu suat nhan vien',
        type: [TechnicianPerformanceDto],
    })
    nhan_vien: TechnicianPerformanceDto[];

    @ApiProperty({
        description: 'Thong ke tong hop',
    })
    thong_ke: {
        tong_nhan_vien: number;
        tong_cong_viec_hoan_thanh: number;
        diem_danh_gia_tb_chung: number | null;
    };

    @ApiProperty({
        description: 'Khoang thoi gian thong ke (neu co)',
    })
    khoang_thoi_gian?: {
        tu_ngay: string;
        den_ngay: string;
    };
}
