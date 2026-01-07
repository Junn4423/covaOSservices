/**
 * ============================================================
 * DTOs - StockPile Sản Phẩm Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  LƯU Ý QUAN TRỌNG VỀ DECIMAL:
 * Prisma trả về Prisma.Decimal object, không phải number.
 * Để Frontend dễ xử lý, cần convert sang string/number.
 *
 * Cách xử lý:
 * 1. Dùng @Transform decorator trong DTO để convert input
 * 2. Service sẽ handle convert output (toNumber() hoặc toString())
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsNotEmpty,
    MaxLength,
    IsUUID,
    IsNumber,
    Min,
    IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Loại sản phẩm - match với Prisma enum
 */
export enum LoaiSanPham {
    HANG_HOA = 'HANG_HOA',
    DICH_VU = 'DICH_VU',
    COMBO = 'COMBO',
}

// ============================================================
// HELPER: Decimal Transform
// ============================================================

/**
 * Transform function để convert string/number thành Decimal-compatible value
 * Prisma sẽ tự handle việc convert sang Decimal khi save
 */
export function transformToDecimal(value: any): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
}

/**
 * Transform Prisma Decimal output thành number cho response
 * Dùng trong service khi trả về data
 */
export function decimalToNumber(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

// ============================================================
// CREATE DTO
// ============================================================

/**
 * DTO để tạo sản phẩm mới
 */
export class CreateSanPhamDto {
    @ApiPropertyOptional({
        description: 'Mã sản phẩm (auto-generate nếu không gửi, format: SP-{Timestamp})',
        example: 'SP-001',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Mã sản phẩm phải là chuỗi' })
    @MaxLength(100, { message: 'Mã sản phẩm tối đa 100 ký tự' })
    @Transform(({ value }) => value?.trim())
    ma_san_pham?: string;

    @ApiProperty({
        description: 'Tên sản phẩm',
        example: 'Bộ vệ sinh máy lạnh',
        maxLength: 255,
    })
    @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
    @IsString({ message: 'Tên sản phẩm phải là chuỗi' })
    @MaxLength(255, { message: 'Tên sản phẩm tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim())
    ten_san_pham: string;

    @ApiPropertyOptional({
        description: 'Loại sản phẩm',
        enum: LoaiSanPham,
        default: LoaiSanPham.HANG_HOA,
    })
    @IsOptional()
    @IsEnum(LoaiSanPham, { message: 'Loại sản phẩm không hợp lệ (HANG_HOA, DICH_VU, COMBO)' })
    loai_san_pham?: LoaiSanPham;

    @ApiPropertyOptional({
        description: 'Giá bán (VNĐ) - phải >= 0',
        example: 150000,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Giá bán phải là số' })
    @Min(0, { message: 'Giá bán phải >= 0' })
    @Transform(({ value }) => transformToDecimal(value))
    gia_ban?: number;

    @ApiPropertyOptional({
        description: 'Giá vốn/Giá nhập (VNĐ) - phải >= 0',
        example: 100000,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Giá vốn phải là số' })
    @Min(0, { message: 'Giá vốn phải >= 0' })
    @Transform(({ value }) => transformToDecimal(value))
    gia_von?: number;

    @ApiPropertyOptional({
        description: 'Đơn vị tính',
        example: 'Bộ',
        maxLength: 50,
    })
    @IsOptional()
    @IsString({ message: 'Đơn vị tính phải là chuỗi' })
    @MaxLength(50, { message: 'Đơn vị tính tối đa 50 ký tự' })
    @Transform(({ value }) => value?.trim())
    don_vi_tinh?: string;

    @ApiPropertyOptional({
        description: 'URL hình ảnh sản phẩm',
        example: 'https://storage.example.com/products/sp001.jpg',
    })
    @IsOptional()
    @IsString({ message: 'URL hình ảnh phải là chuỗi' })
    @MaxLength(500, { message: 'URL tối đa 500 ký tự' })
    hinh_anh?: string;

    @ApiPropertyOptional({
        description: 'Mô tả chi tiết sản phẩm',
        example: 'Bộ vệ sinh máy lạnh bao gồm: vệ sinh dàn lạnh, dàn nóng, kiểm tra gas...',
    })
    @IsOptional()
    @IsString({ message: 'Mô tả phải là chuỗi' })
    mo_ta?: string;

    @ApiPropertyOptional({
        description: 'ID nhóm sản phẩm (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID nhóm sản phẩm phải là UUID hợp lệ' })
    id_nhom_san_pham?: string;
}

// ============================================================
// UPDATE DTO
// ============================================================

/**
 * DTO để cập nhật sản phẩm - tất cả fields optional
 */
export class UpdateSanPhamDto extends PartialType(CreateSanPhamDto) { }

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Query params cho danh sách sản phẩm
 */
export class QuerySanPhamDto {
    @ApiPropertyOptional({
        description: 'Số trang',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số items mỗi trang',
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
        description: 'Từ khóa tìm kiếm (theo tên, mã SP)',
        example: 'máy lạnh',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo ID nhóm sản phẩm',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID nhóm phải là UUID hợp lệ' })
    id_nhom_san_pham?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo loại sản phẩm',
        enum: LoaiSanPham,
    })
    @IsOptional()
    @IsEnum(LoaiSanPham)
    loai_san_pham?: LoaiSanPham;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Response DTO cho nhóm sản phẩm (embedded)
 */
export class NhomSanPhamEmbeddedDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Dịch vụ máy lạnh' })
    ten_nhom: string;
}

/**
 * Response DTO cho một sản phẩm
 */
export class SanPhamResponseDto {
    @ApiProperty({ description: 'ID sản phẩm (UUID)' })
    id: string;

    @ApiProperty({ description: 'Mã sản phẩm', example: 'SP-1704585600000' })
    ma_san_pham: string;

    @ApiProperty({ description: 'Tên sản phẩm' })
    ten_san_pham: string;

    @ApiProperty({ description: 'Loại sản phẩm', enum: LoaiSanPham })
    loai_san_pham: LoaiSanPham;

    @ApiProperty({ description: 'Giá bán (VNĐ)', example: 150000 })
    gia_ban: number;

    @ApiProperty({ description: 'Giá vốn (VNĐ)', example: 100000 })
    gia_von: number;

    @ApiPropertyOptional({ description: 'Đơn vị tính' })
    don_vi_tinh?: string;

    @ApiPropertyOptional({ description: 'URL hình ảnh' })
    hinh_anh?: string;

    @ApiPropertyOptional({ description: 'Mô tả' })
    mo_ta?: string;

    @ApiPropertyOptional({
        description: 'Thông tin nhóm sản phẩm',
        type: NhomSanPhamEmbeddedDto,
    })
    nhom_san_pham?: NhomSanPhamEmbeddedDto;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;
}

/**
 * Response cho danh sách sản phẩm có phân trang
 */
export class SanPhamListResponseDto {
    @ApiProperty({ type: [SanPhamResponseDto] })
    data: SanPhamResponseDto[];

    @ApiProperty({
        description: 'Thông tin phân trang',
        example: { page: 1, limit: 20, total: 100, totalPages: 5 },
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
