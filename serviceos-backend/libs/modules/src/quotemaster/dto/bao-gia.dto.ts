/**
 * ============================================================
 * DTOs - QuoteMaster Module (Báo Giá)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  LƯU Ý QUAN TRỌNG VỀ DECIMAL:
 * Prisma trả về Prisma.Decimal object, không phải number.
 * Để Frontend dễ xử lý, cần convert sang string/number.
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
    IsArray,
    ValidateNested,
    ArrayMinSize,
    IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Trạng thái báo giá - match với Prisma enum
 */
export enum TrangThaiBaoGia {
    DRAFT = 'DRAFT',
    SENT = 'SENT',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
}

// ============================================================
// HELPER: Decimal Transform (Internal - không export để tránh conflict)
// ============================================================

/**
 * Transform function để convert string/number thành Decimal-compatible value
 * @internal
 */
function transformToDecimal(value: any): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
}

/**
 * Transform Prisma Decimal output thành number cho response
 * @internal - Export riêng cho service sử dụng
 */
export function decimalToNumberBaoGia(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

// ============================================================
// NESTED DTO: Chi tiết sản phẩm trong báo giá
// ============================================================

/**
 * DTO cho một item trong báo giá khi tạo mới
 */
export class CreateBaoGiaItemDto {
    @ApiProperty({
        description: 'ID sản phẩm (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
    @IsUUID('4', { message: 'ID sản phẩm phải là UUID hợp lệ' })
    id_san_pham: string;

    @ApiProperty({
        description: 'Số lượng (phải >= 1)',
        example: 2,
        minimum: 1,
        default: 1,
    })
    @IsNotEmpty({ message: 'Số lượng không được để trống' })
    @IsInt({ message: 'Số lượng phải là số nguyên' })
    @Min(1, { message: 'Số lượng phải >= 1' })
    @Type(() => Number)
    so_luong: number;

    @ApiPropertyOptional({
        description: 'Ghi chú cho dòng sản phẩm này',
        example: 'Giao hàng trong 7 ngày',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
    @Transform(({ value }) => value?.trim())
    ghi_chu?: string;
}

// ============================================================
// CREATE DTO
// ============================================================

/**
 * DTO để tạo báo giá mới
 */
export class CreateBaoGiaDto {
    @ApiProperty({
        description: 'ID khách hàng (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID khách hàng không được để trống' })
    @IsUUID('4', { message: 'ID khách hàng phải là UUID hợp lệ' })
    id_khach_hang: string;

    @ApiPropertyOptional({
        description: 'Tiêu đề báo giá',
        example: 'Báo giá dịch vụ bảo trì máy lạnh',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Tiêu đề phải là chuỗi' })
    @MaxLength(255, { message: 'Tiêu đề tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim())
    tieu_de?: string;

    @ApiPropertyOptional({
        description: 'Ngày hết hạn báo giá (ISO 8601)',
        example: '2026-01-15',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày hết hạn phải là chuỗi ngày hợp lệ (YYYY-MM-DD)' })
    ngay_het_han?: string;

    @ApiPropertyOptional({
        description: '% VAT (mặc định 10%)',
        example: 10,
        minimum: 0,
        maximum: 100,
        default: 10,
    })
    @IsOptional()
    @IsNumber({}, { message: 'VAT phải là số' })
    @Min(0, { message: 'VAT phải >= 0' })
    @Transform(({ value }) => transformToDecimal(value))
    thue_vat?: number;

    @ApiPropertyOptional({
        description: 'Ghi chú cho báo giá',
        example: 'Báo giá có hiệu lực trong 7 ngày',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;

    @ApiProperty({
        description: 'Danh sách sản phẩm/dịch vụ trong báo giá',
        type: [CreateBaoGiaItemDto],
        minItems: 1,
    })
    @IsArray({ message: 'Danh sách items phải là mảng' })
    @ArrayMinSize(1, { message: 'Báo giá phải có ít nhất 1 sản phẩm' })
    @ValidateNested({ each: true })
    @Type(() => CreateBaoGiaItemDto)
    items: CreateBaoGiaItemDto[];
}

// ============================================================
// UPDATE STATUS DTO
// ============================================================

/**
 * DTO để cập nhật trạng thái báo giá
 */
export class UpdateBaoGiaStatusDto {
    @ApiProperty({
        description: 'Trạng thái mới',
        enum: TrangThaiBaoGia,
        example: TrangThaiBaoGia.SENT,
    })
    @IsNotEmpty({ message: 'Trạng thái không được để trống' })
    @IsEnum(TrangThaiBaoGia, {
        message: 'Trạng thái không hợp lệ (DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED)',
    })
    trang_thai: TrangThaiBaoGia;
}

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Query params cho danh sách báo giá
 */
export class QueryBaoGiaDto {
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
        description: 'Lọc theo trạng thái',
        enum: TrangThaiBaoGia,
    })
    @IsOptional()
    @IsEnum(TrangThaiBaoGia)
    trang_thai?: TrangThaiBaoGia;

    @ApiPropertyOptional({
        description: 'Lọc theo ID khách hàng',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID khách hàng phải là UUID hợp lệ' })
    id_khach_hang?: string;

    @ApiPropertyOptional({
        description: 'Từ ngày (ISO 8601: YYYY-MM-DD)',
        example: '2026-01-01',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Từ ngày phải là chuỗi ngày hợp lệ' })
    tu_ngay?: string;

    @ApiPropertyOptional({
        description: 'Đến ngày (ISO 8601: YYYY-MM-DD)',
        example: '2026-01-31',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Đến ngày phải là chuỗi ngày hợp lệ' })
    den_ngay?: string;

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm (theo mã báo giá, tiêu đề)',
        example: 'BG-2026',
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
export class KhachHangEmbeddedDto {
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
 * Response DTO cho sản phẩm (embedded in chi tiết)
 */
export class SanPhamEmbeddedDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'SP-001' })
    ma_san_pham: string;

    @ApiProperty({ example: 'Dịch vụ vệ sinh máy lạnh' })
    ten_san_pham: string;

    @ApiPropertyOptional({ example: 'Bộ' })
    don_vi_tinh?: string;
}

/**
 * Response DTO cho chi tiết báo giá
 */
export class ChiTietBaoGiaResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    id_san_pham: string;

    @ApiProperty({ example: 2 })
    so_luong: number;

    @ApiProperty({ example: 150000 })
    don_gia: number;

    @ApiProperty({ example: 300000 })
    thanh_tien: number;

    @ApiPropertyOptional()
    ghi_chu?: string;

    @ApiProperty({ type: SanPhamEmbeddedDto })
    san_pham: SanPhamEmbeddedDto;
}

/**
 * Response DTO cho một báo giá
 */
export class BaoGiaResponseDto {
    @ApiProperty({ description: 'ID báo giá (UUID)' })
    id: string;

    @ApiProperty({ description: 'Mã báo giá', example: 'BG-1704585600000' })
    ma_bao_gia: string;

    @ApiPropertyOptional({ description: 'Tiêu đề báo giá' })
    tieu_de?: string;

    @ApiProperty({ description: 'ID khách hàng' })
    id_khach_hang: string;

    @ApiProperty({ description: 'Ngày lập báo giá' })
    ngay_bao_gia: Date;

    @ApiPropertyOptional({ description: 'Ngày hết hạn' })
    ngay_het_han?: Date;

    @ApiProperty({ description: 'Trạng thái', enum: TrangThaiBaoGia })
    trang_thai: TrangThaiBaoGia;

    @ApiProperty({ description: 'Tổng tiền trước thuế (VNĐ)', example: 1000000 })
    tong_tien_truoc_thue: number;

    @ApiProperty({ description: '% VAT', example: 10 })
    thue_vat: number;

    @ApiProperty({ description: 'Tiền thuế (VNĐ)', example: 100000 })
    tien_thue: number;

    @ApiProperty({ description: 'Tổng tiền sau thuế (VNĐ)', example: 1100000 })
    tong_tien_sau_thue: number;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiProperty({ description: 'Thông tin khách hàng', type: KhachHangEmbeddedDto })
    khach_hang: KhachHangEmbeddedDto;

    @ApiProperty({ description: 'Chi tiết báo giá', type: [ChiTietBaoGiaResponseDto] })
    chi_tiet: ChiTietBaoGiaResponseDto[];

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;
}

/**
 * Response cho danh sách báo giá có phân trang
 */
export class BaoGiaListResponseDto {
    @ApiProperty({ type: [BaoGiaResponseDto] })
    data: BaoGiaResponseDto[];

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
