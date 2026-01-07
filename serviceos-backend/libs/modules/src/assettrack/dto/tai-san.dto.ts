/**
 * ============================================================
 * DTOs - AssetTrack Module (Tai San - Asset Management)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Asset Management DTOs:
 * - Create, Update, Query assets
 * - Price validation
 * - Status handling
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    IsUUID,
    IsNumber,
    Min,
    IsInt,
    IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Asset status enum
 * 1 = Active (Available)
 * 2 = In Use (Assigned)
 * 3 = Maintenance
 * 4 = Lost
 * 5 = Disposed
 */
export enum TrangThaiTaiSan {
    AVAILABLE = 1,
    IN_USE = 2,
    MAINTENANCE = 3,
    LOST = 4,
    DISPOSED = 5,
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Convert Prisma Decimal to number for asset price
 */
function decimalToNumber(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

// ============================================================
// CREATE DTO
// ============================================================

/**
 * DTO to create a new asset
 */
export class CreateTaiSanDto {
    @ApiProperty({
        description: 'Asset name',
        example: 'Laptop Dell XPS 15',
        maxLength: 255,
    })
    @IsNotEmpty({ message: 'Ten tai san khong duoc de trong' })
    @IsString({ message: 'Ten tai san phai la chuoi' })
    @MaxLength(255, { message: 'Ten tai san toi da 255 ky tu' })
    @Transform(({ value }) => value?.trim())
    ten_tai_san: string;

    @ApiPropertyOptional({
        description: 'Asset code (auto-generated if not provided)',
        example: 'TS-001',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Ma tai san phai la chuoi' })
    @MaxLength(100, { message: 'Ma tai san toi da 100 ky tu' })
    @Transform(({ value }) => value?.trim())
    ma_tai_san?: string;

    @ApiPropertyOptional({
        description: 'Serial number (unique per tenant)',
        example: 'SN-ABC123456',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Ma seri phai la chuoi' })
    @MaxLength(100, { message: 'Ma seri toi da 100 ky tu' })
    @Transform(({ value }) => value?.trim())
    ma_seri?: string;

    @ApiPropertyOptional({
        description: 'Asset type/category',
        example: 'Laptop',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Loai tai san phai la chuoi' })
    @MaxLength(100, { message: 'Loai tai san toi da 100 ky tu' })
    @Transform(({ value }) => value?.trim())
    loai_tai_san?: string;

    @ApiPropertyOptional({
        description: 'Purchase date (YYYY-MM-DD)',
        example: '2025-01-15',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay mua phai theo dinh dang YYYY-MM-DD' })
    ngay_mua?: string;

    @ApiPropertyOptional({
        description: 'Purchase price (must be >= 0)',
        example: 25000000,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Gia mua phai la so' })
    @Min(0, { message: 'Gia mua phai >= 0' })
    @Type(() => Number)
    gia_mua?: number;

    @ApiPropertyOptional({
        description: 'Supplier/Vendor name',
        example: 'FPT Shop',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Nha cung cap phai la chuoi' })
    @MaxLength(255, { message: 'Nha cung cap toi da 255 ky tu' })
    @Transform(({ value }) => value?.trim())
    nha_cung_cap?: string;

    @ApiPropertyOptional({
        description: 'Warranty expiry date (YYYY-MM-DD)',
        example: '2027-01-15',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Thoi han bao hanh phai theo dinh dang YYYY-MM-DD' })
    thoi_han_bao_hanh?: string;

    @ApiPropertyOptional({
        description: 'Current location',
        example: 'Van phong HCM - Tang 5',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Vi tri hien tai phai la chuoi' })
    @MaxLength(255, { message: 'Vi tri hien tai toi da 255 ky tu' })
    @Transform(({ value }) => value?.trim())
    vi_tri_hien_tai?: string;

    @ApiPropertyOptional({
        description: 'Notes',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chu phai la chuoi' })
    ghi_chu?: string;
}

// ============================================================
// UPDATE DTO
// ============================================================

/**
 * DTO to update an asset
 */
export class UpdateTaiSanDto {
    @ApiPropertyOptional({
        description: 'Asset name',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Ten tai san phai la chuoi' })
    @MaxLength(255, { message: 'Ten tai san toi da 255 ky tu' })
    @Transform(({ value }) => value?.trim())
    ten_tai_san?: string;

    @ApiPropertyOptional({
        description: 'Asset code',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Ma tai san phai la chuoi' })
    @MaxLength(100, { message: 'Ma tai san toi da 100 ky tu' })
    @Transform(({ value }) => value?.trim())
    ma_tai_san?: string;

    @ApiPropertyOptional({
        description: 'Serial number',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Ma seri phai la chuoi' })
    @MaxLength(100, { message: 'Ma seri toi da 100 ky tu' })
    @Transform(({ value }) => value?.trim())
    ma_seri?: string;

    @ApiPropertyOptional({
        description: 'Asset type/category',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Loai tai san phai la chuoi' })
    @MaxLength(100, { message: 'Loai tai san toi da 100 ky tu' })
    @Transform(({ value }) => value?.trim())
    loai_tai_san?: string;

    @ApiPropertyOptional({
        description: 'Purchase date (YYYY-MM-DD)',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay mua phai theo dinh dang YYYY-MM-DD' })
    ngay_mua?: string;

    @ApiPropertyOptional({
        description: 'Purchase price (must be >= 0)',
        minimum: 0,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Gia mua phai la so' })
    @Min(0, { message: 'Gia mua phai >= 0' })
    @Type(() => Number)
    gia_mua?: number;

    @ApiPropertyOptional({
        description: 'Supplier/Vendor name',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Nha cung cap phai la chuoi' })
    @MaxLength(255, { message: 'Nha cung cap toi da 255 ky tu' })
    @Transform(({ value }) => value?.trim())
    nha_cung_cap?: string;

    @ApiPropertyOptional({
        description: 'Warranty expiry date (YYYY-MM-DD)',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Thoi han bao hanh phai theo dinh dang YYYY-MM-DD' })
    thoi_han_bao_hanh?: string;

    @ApiPropertyOptional({
        description: 'Current location',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Vi tri hien tai phai la chuoi' })
    @MaxLength(255, { message: 'Vi tri hien tai toi da 255 ky tu' })
    @Transform(({ value }) => value?.trim())
    vi_tri_hien_tai?: string;

    @ApiPropertyOptional({
        description: 'Status (1=Available, 2=InUse, 3=Maintenance, 4=Lost, 5=Disposed)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Trang thai phai la so nguyen' })
    trang_thai?: number;

    @ApiPropertyOptional({
        description: 'Notes',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chu phai la chuoi' })
    ghi_chu?: string;
}

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Query params for asset list
 */
export class QueryTaiSanDto {
    @ApiPropertyOptional({
        description: 'Page number',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Items per page',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Filter by asset type',
        example: 'Laptop',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    loai_tai_san?: string;

    @ApiPropertyOptional({
        description: 'Filter by status (1=Available, 2=InUse, 3=Maintenance, 4=Lost)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    trang_thai?: number;

    @ApiPropertyOptional({
        description: 'Filter by current holder (user ID)',
    })
    @IsOptional()
    @IsUUID('4', { message: 'nguoi_dang_giu phai la UUID hop le' })
    nguoi_dang_giu?: string;

    @ApiPropertyOptional({
        description: 'Search by name, code, or serial',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Embedded user info for asset
 */
export class TaiSanNguoiDungDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Nguyen Van A' })
    ho_ten: string;

    @ApiPropertyOptional({ example: 'nguyenvana@email.com' })
    email?: string;
}

/**
 * Response DTO for an asset
 */
export class TaiSanResponseDto {
    @ApiProperty({ description: 'Asset ID (UUID)' })
    id: string;

    @ApiPropertyOptional({ description: 'Asset code' })
    ma_tai_san?: string;

    @ApiProperty({ description: 'Asset name' })
    ten_tai_san: string;

    @ApiPropertyOptional({ description: 'Serial number' })
    ma_seri?: string;

    @ApiPropertyOptional({ description: 'Asset type' })
    loai_tai_san?: string;

    @ApiPropertyOptional({ description: 'Purchase date' })
    ngay_mua?: Date;

    @ApiPropertyOptional({ description: 'Purchase price' })
    gia_mua?: number;

    @ApiPropertyOptional({ description: 'Supplier' })
    nha_cung_cap?: string;

    @ApiPropertyOptional({ description: 'Warranty expiry' })
    thoi_han_bao_hanh?: Date;

    @ApiPropertyOptional({ description: 'Current location' })
    vi_tri_hien_tai?: string;

    @ApiProperty({ description: 'Status', example: 1 })
    trang_thai: number;

    @ApiPropertyOptional({ description: 'Notes' })
    ghi_chu?: string;

    @ApiPropertyOptional({ description: 'Current holder info', type: TaiSanNguoiDungDto })
    nguoi_dang_giu?: TaiSanNguoiDungDto;

    @ApiProperty({ description: 'Created date' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Updated date' })
    ngay_cap_nhat: Date;
}

/**
 * Response for paginated asset list
 */
export class TaiSanListResponseDto {
    @ApiProperty({ type: [TaiSanResponseDto] })
    data: TaiSanResponseDto[];

    @ApiProperty({
        description: 'Pagination info',
        example: { page: 1, limit: 20, total: 50, totalPages: 3 },
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Map status code to text
 */
export function mapTrangThaiToText(trangThai: number): string {
    const statusMap: Record<number, string> = {
        [TrangThaiTaiSan.AVAILABLE]: 'AVAILABLE',
        [TrangThaiTaiSan.IN_USE]: 'IN_USE',
        [TrangThaiTaiSan.MAINTENANCE]: 'MAINTENANCE',
        [TrangThaiTaiSan.LOST]: 'LOST',
        [TrangThaiTaiSan.DISPOSED]: 'DISPOSED',
    };
    return statusMap[trangThai] || 'UNKNOWN';
}
