/**
 * ============================================================
 * DTOs - QuoteMaster Module (Hợp Đồng)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  PHASE 6: Contract Management
 * - CreateHopDongDto: Tạo hợp đồng thủ công
 * - CreateHopDongFromQuoteDto: Convert từ báo giá
 * - UpdateHopDongDto: Cập nhật hợp đồng
 * - QueryHopDongDto: Filter & pagination
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
    IsDateString,
    IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Trạng thái hợp đồng - Map với TinyInt trong DB
 * 0 - DRAFT: Nháp
 * 1 - ACTIVE: Đang hiệu lực
 * 2 - EXPIRED: Đã hết hạn
 * 3 - LIQUIDATED: Đã thanh lý
 * 4 - CANCELLED: Đã hủy
 */
export enum TrangThaiHopDong {
    DRAFT = 0,
    ACTIVE = 1,
    EXPIRED = 2,
    LIQUIDATED = 3,
    CANCELLED = 4,
}

/**
 * Labels cho trạng thái hợp đồng (Tiếng Việt)
 */
export const TrangThaiHopDongLabel: Record<TrangThaiHopDong, string> = {
    [TrangThaiHopDong.DRAFT]: 'Nháp',
    [TrangThaiHopDong.ACTIVE]: 'Đang hiệu lực',
    [TrangThaiHopDong.EXPIRED]: 'Đã hết hạn',
    [TrangThaiHopDong.LIQUIDATED]: 'Đã thanh lý',
    [TrangThaiHopDong.CANCELLED]: 'Đã hủy',
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Transform Prisma Decimal output thành number cho response
 */
export function decimalToNumberHopDong(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

/**
 * Transform function để convert string/number thành Decimal-compatible value
 */
function transformToDecimal(value: any): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
}

// ============================================================
// CREATE DTO - Tạo hợp đồng thủ công
// ============================================================

export class CreateHopDongDto {
    @ApiProperty({
        description: 'ID khách hàng (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID khách hàng không được để trống' })
    @IsUUID('4', { message: 'ID khách hàng phải là UUID hợp lệ' })
    id_khach_hang: string;

    @ApiPropertyOptional({
        description: 'Tên hợp đồng',
        example: 'Hợp đồng bảo trì hệ thống máy lạnh 2026',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Tên hợp đồng phải là chuỗi' })
    @MaxLength(255, { message: 'Tên hợp đồng tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim())
    ten_hop_dong?: string;

    @ApiProperty({
        description: 'Giá trị hợp đồng (VNĐ)',
        example: 50000000,
        minimum: 0,
    })
    @IsNotEmpty({ message: 'Giá trị hợp đồng không được để trống' })
    @IsNumber({}, { message: 'Giá trị hợp đồng phải là số' })
    @Min(0, { message: 'Giá trị hợp đồng phải >= 0' })
    @Transform(({ value }) => transformToDecimal(value))
    gia_tri_hop_dong: number;

    @ApiPropertyOptional({
        description: 'Ngày ký hợp đồng (ISO 8601: YYYY-MM-DD). Mặc định: Hôm nay',
        example: '2026-01-07',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày ký phải là chuỗi ngày hợp lệ (YYYY-MM-DD)' })
    ngay_ky?: string;

    @ApiPropertyOptional({
        description: 'Ngày hết hạn hợp đồng (ISO 8601: YYYY-MM-DD)',
        example: '2026-12-31',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày hết hạn phải là chuỗi ngày hợp lệ (YYYY-MM-DD)' })
    ngay_het_han?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú',
        example: 'Hợp đồng bảo trì định kỳ 3 tháng/lần',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;
}

// ============================================================
// CREATE FROM QUOTE DTO - Convert từ báo giá
// ============================================================

export class CreateHopDongFromQuoteDto {
    @ApiProperty({
        description: 'ID báo giá cần convert (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID báo giá không được để trống' })
    @IsUUID('4', { message: 'ID báo giá phải là UUID hợp lệ' })
    id_bao_gia: string;

    @ApiPropertyOptional({
        description: 'Tên hợp đồng (tùy chọn, mặc định lấy từ tiêu đề báo giá)',
        example: 'Hợp đồng từ báo giá BG-xxxxx',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Tên hợp đồng phải là chuỗi' })
    @MaxLength(255, { message: 'Tên hợp đồng tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim())
    ten_hop_dong?: string;

    @ApiPropertyOptional({
        description: 'Ngày hết hạn hợp đồng (ISO 8601: YYYY-MM-DD)',
        example: '2026-12-31',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày hết hạn phải là chuỗi ngày hợp lệ (YYYY-MM-DD)' })
    ngay_het_han?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú bổ sung cho hợp đồng',
        example: 'Chuyển đổi từ báo giá đã được khách duyệt',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;
}

// ============================================================
// UPDATE DTO - Cập nhật hợp đồng
// ============================================================

export class UpdateHopDongDto {
    @ApiPropertyOptional({
        description: 'Tên hợp đồng',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Tên hợp đồng phải là chuỗi' })
    @MaxLength(255, { message: 'Tên hợp đồng tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim())
    ten_hop_dong?: string;

    @ApiPropertyOptional({
        description: 'Ngày hết hạn mới (ISO 8601)',
        example: '2027-01-01',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày hết hạn phải là chuỗi ngày hợp lệ' })
    ngay_het_han?: string;

    @ApiPropertyOptional({
        description: 'URL file PDF hợp đồng đã ký',
        example: 'https://storage.example.com/contracts/HD-xxx.pdf',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'URL PDF phải là chuỗi' })
    @MaxLength(500, { message: 'URL PDF tối đa 500 ký tự' })
    file_pdf_url?: string;

    @ApiPropertyOptional({
        description: 'URL chữ ký số',
        example: 'https://storage.example.com/signatures/HD-xxx-sig.png',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'URL chữ ký phải là chuỗi' })
    @MaxLength(500, { message: 'URL chữ ký tối đa 500 ký tự' })
    chu_ky_so_url?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;
}

// ============================================================
// UPDATE STATUS DTO
// ============================================================

export class UpdateHopDongStatusDto {
    @ApiProperty({
        description: 'Trạng thái mới (0: DRAFT, 1: ACTIVE, 2: EXPIRED, 3: LIQUIDATED, 4: CANCELLED)',
        enum: TrangThaiHopDong,
        example: TrangThaiHopDong.ACTIVE,
    })
    @IsNotEmpty({ message: 'Trạng thái không được để trống' })
    @IsEnum(TrangThaiHopDong, {
        message: 'Trạng thái không hợp lệ (0: DRAFT, 1: ACTIVE, 2: EXPIRED, 3: LIQUIDATED, 4: CANCELLED)',
    })
    @Type(() => Number)
    trang_thai: TrangThaiHopDong;
}

// ============================================================
// QUERY DTO - Filter & Pagination
// ============================================================

export class QueryHopDongDto {
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
        description: 'Lọc theo trạng thái (0: DRAFT, 1: ACTIVE, 2: EXPIRED, 3: LIQUIDATED, 4: CANCELLED)',
        enum: TrangThaiHopDong,
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(TrangThaiHopDong)
    trang_thai?: TrangThaiHopDong;

    @ApiPropertyOptional({
        description: 'Lọc theo ID khách hàng',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID khách hàng phải là UUID hợp lệ' })
    id_khach_hang?: string;

    @ApiPropertyOptional({
        description: 'Lọc các hợp đồng sắp hết hạn (true = trong 30 ngày tới)',
        example: true,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    sap_het_han?: boolean;

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm (mã hợp đồng, tên hợp đồng)',
        example: 'HD-2026',
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
 * Response DTO cho khách hàng (embedded)
 */
export class KhachHangHopDongEmbeddedDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Nguyễn Văn A' })
    ho_ten: string;

    @ApiPropertyOptional({ example: '0901234567' })
    so_dien_thoai?: string;

    @ApiPropertyOptional({ example: 'nguyenvana@email.com' })
    email?: string;
}

/**
 * Response DTO cho báo giá liên kết (embedded)
 */
export class BaoGiaHopDongEmbeddedDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'BG-1704585600000' })
    ma_bao_gia: string;

    @ApiPropertyOptional({ example: 'Báo giá bảo trì máy lạnh' })
    tieu_de?: string;

    @ApiProperty({ example: 1100000 })
    tong_tien_sau_thue: number;
}

/**
 * Response DTO cho một hợp đồng
 */
export class HopDongResponseDto {
    @ApiProperty({ description: 'ID hợp đồng (UUID)' })
    id: string;

    @ApiProperty({ description: 'Mã hợp đồng', example: 'HD-1704585600000' })
    ma_hop_dong: string;

    @ApiPropertyOptional({ description: 'Tên hợp đồng' })
    ten_hop_dong?: string;

    @ApiPropertyOptional({ description: 'ID khách hàng' })
    id_khach_hang?: string;

    @ApiPropertyOptional({ description: 'ID báo giá gốc (nếu convert từ báo giá)' })
    id_bao_gia?: string;

    @ApiProperty({ description: 'Giá trị hợp đồng (VNĐ)', example: 50000000 })
    gia_tri_hop_dong: number;

    @ApiPropertyOptional({ description: 'Ngày ký' })
    ngay_ky?: Date;

    @ApiPropertyOptional({ description: 'Ngày hết hạn' })
    ngay_het_han?: Date;

    @ApiPropertyOptional({ description: 'URL file PDF' })
    file_pdf_url?: string;

    @ApiPropertyOptional({ description: 'URL chữ ký số' })
    chu_ky_so_url?: string;

    @ApiProperty({
        description: 'Trạng thái (0: DRAFT, 1: ACTIVE, 2: EXPIRED, 3: LIQUIDATED, 4: CANCELLED)',
        enum: TrangThaiHopDong,
    })
    trang_thai: TrangThaiHopDong;

    @ApiProperty({
        description: 'Label trạng thái (Tiếng Việt)',
        example: 'Đang hiệu lực',
    })
    trang_thai_label: string;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiPropertyOptional({ description: 'Thông tin khách hàng', type: KhachHangHopDongEmbeddedDto })
    khach_hang?: KhachHangHopDongEmbeddedDto;

    @ApiPropertyOptional({ description: 'Thông tin báo giá gốc', type: BaoGiaHopDongEmbeddedDto })
    bao_gia?: BaoGiaHopDongEmbeddedDto;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;
}

/**
 * Response cho danh sách hợp đồng có phân trang
 */
export class HopDongListResponseDto {
    @ApiProperty({ type: [HopDongResponseDto] })
    data: HopDongResponseDto[];

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

/**
 * Response cho danh sách hợp đồng sắp hết hạn
 */
export class HopDongExpiringResponseDto {
    @ApiProperty({ type: [HopDongResponseDto] })
    data: HopDongResponseDto[];

    @ApiProperty({ description: 'Tổng số hợp đồng sắp hết hạn' })
    total: number;

    @ApiProperty({ description: 'Ngày kiểm tra (hôm nay)' })
    check_date: Date;

    @ApiProperty({ description: 'Số ngày cảnh báo trước', example: 30 })
    warning_days: number;
}
