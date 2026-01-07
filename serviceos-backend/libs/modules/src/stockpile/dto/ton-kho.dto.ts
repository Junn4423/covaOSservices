/**
 * ============================================================
 * DTOs - StockPile TonKho (Inventory) Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  INVENTORY MANAGEMENT:
 * Quản lý tồn kho với các chức năng:
 * - Nhập kho (Import)
 * - Xuất kho (Export)
 * - Chuyển kho (Transfer)
 * - Kiểm kê (Inventory Check)
 *
 *  AUDIT TRAIL:
 * Mọi thay đổi đều được ghi vào LichSuKho
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsUUID,
    IsNumber,
    Min,
    IsInt,
    IsArray,
    ValidateNested,
    ArrayMinSize,
    IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Loại phiếu kho - match với Prisma enum
 */
export enum LoaiPhieuKho {
    NHAP = 'nhap',
    XUAT = 'xuat',
    CHUYEN = 'chuyen',
    KIEM_KE = 'kiem_ke',
}

/**
 * Nguồn nhập kho
 */
export enum NguonNhap {
    NHA_CUNG_CAP = 'NHA_CUNG_CAP',
    DON_HANG_NCC = 'DON_HANG_NCC', // Từ đơn đặt hàng NCC (PO)
    CHUYEN_KHO = 'CHUYEN_KHO',
    TRA_HANG = 'TRA_HANG',
    KHAC = 'KHAC',
}

// ============================================================
// HELPER: Decimal Transform
// ============================================================

/**
 * Transform Prisma Decimal output thành number cho response
 */
export function decimalToNumberInventory(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

// ============================================================
// ITEM DTOs (Dùng cho Nhập/Xuất/Chuyển kho)
// ============================================================

/**
 * Item nhập kho
 */
export class NhapKhoItemDto {
    @ApiProperty({
        description: 'ID sản phẩm',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
    @IsUUID('4', { message: 'ID sản phẩm phải là UUID hợp lệ' })
    san_pham_id: string;

    @ApiProperty({
        description: 'Số lượng nhập (phải > 0)',
        example: 10,
        minimum: 1,
    })
    @IsNotEmpty({ message: 'Số lượng không được để trống' })
    @IsInt({ message: 'Số lượng phải là số nguyên' })
    @Min(1, { message: 'Số lượng phải > 0' })
    so_luong: number;

    @ApiPropertyOptional({
        description: 'Đơn giá nhập (>= 0)',
        example: 50000,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Đơn giá phải là số' })
    @Min(0, { message: 'Đơn giá phải >= 0' })
    @Transform(({ value }) => {
        if (value === null || value === undefined || value === '') return 0;
        return typeof value === 'string' ? parseFloat(value) : value;
    })
    don_gia?: number;
}

/**
 * Item xuất kho
 */
export class XuatKhoItemDto {
    @ApiProperty({
        description: 'ID sản phẩm',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
    @IsUUID('4', { message: 'ID sản phẩm phải là UUID hợp lệ' })
    san_pham_id: string;

    @ApiProperty({
        description: 'Số lượng xuất (phải > 0)',
        example: 5,
        minimum: 1,
    })
    @IsNotEmpty({ message: 'Số lượng không được để trống' })
    @IsInt({ message: 'Số lượng phải là số nguyên' })
    @Min(1, { message: 'Số lượng phải > 0' })
    so_luong: number;
}

// ============================================================
// NHẬP KHO DTO
// ============================================================

/**
 * DTO để nhập kho
 */
export class NhapKhoDto {
    @ApiProperty({
        description: 'ID kho nhập',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID kho không được để trống' })
    @IsUUID('4', { message: 'ID kho phải là UUID hợp lệ' })
    kho_id: string;

    @ApiProperty({
        description: 'Danh sách sản phẩm nhập kho',
        type: [NhapKhoItemDto],
    })
    @IsArray({ message: 'Items phải là mảng' })
    @ArrayMinSize(1, { message: 'Phải có ít nhất 1 sản phẩm nhập kho' })
    @ValidateNested({ each: true })
    @Type(() => NhapKhoItemDto)
    items: NhapKhoItemDto[];

    @ApiPropertyOptional({
        description: 'Lý do nhập kho',
        example: 'Nhập hàng từ NCC ABC',
    })
    @IsOptional()
    @IsString({ message: 'Lý do phải là chuỗi' })
    @Transform(({ value }) => value?.trim())
    ly_do?: string;

    @ApiPropertyOptional({
        description: 'Nguồn nhập kho',
        enum: NguonNhap,
        default: NguonNhap.NHA_CUNG_CAP,
    })
    @IsOptional()
    @IsEnum(NguonNhap, { message: 'Nguồn nhập không hợp lệ' })
    nguon_nhap?: NguonNhap;
}

// ============================================================
// XUẤT KHO DTO
// ============================================================

/**
 * DTO để xuất kho
 */
export class XuatKhoDto {
    @ApiProperty({
        description: 'ID kho xuất',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID kho không được để trống' })
    @IsUUID('4', { message: 'ID kho phải là UUID hợp lệ' })
    kho_id: string;

    @ApiProperty({
        description: 'Danh sách sản phẩm xuất kho',
        type: [XuatKhoItemDto],
    })
    @IsArray({ message: 'Items phải là mảng' })
    @ArrayMinSize(1, { message: 'Phải có ít nhất 1 sản phẩm xuất kho' })
    @ValidateNested({ each: true })
    @Type(() => XuatKhoItemDto)
    items: XuatKhoItemDto[];

    @ApiPropertyOptional({
        description: 'ID công việc liên quan (dùng khi xuất vật tư cho công việc)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID công việc phải là UUID hợp lệ' })
    cong_viec_id?: string;

    @ApiPropertyOptional({
        description: 'Lý do xuất kho',
        example: 'Xuất vật tư phục vụ công việc CV-001',
    })
    @IsOptional()
    @IsString({ message: 'Lý do phải là chuỗi' })
    @Transform(({ value }) => value?.trim())
    ly_do?: string;
}

// ============================================================
// CHUYỂN KHO DTO
// ============================================================

/**
 * DTO để chuyển kho
 */
export class ChuyenKhoDto {
    @ApiProperty({
        description: 'ID kho xuất (nguồn)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID kho xuất không được để trống' })
    @IsUUID('4', { message: 'ID kho xuất phải là UUID hợp lệ' })
    tu_kho_id: string;

    @ApiProperty({
        description: 'ID kho nhập (đích)',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    @IsNotEmpty({ message: 'ID kho nhập không được để trống' })
    @IsUUID('4', { message: 'ID kho nhập phải là UUID hợp lệ' })
    den_kho_id: string;

    @ApiProperty({
        description: 'Danh sách sản phẩm chuyển kho',
        type: [XuatKhoItemDto],
    })
    @IsArray({ message: 'Items phải là mảng' })
    @ArrayMinSize(1, { message: 'Phải có ít nhất 1 sản phẩm chuyển kho' })
    @ValidateNested({ each: true })
    @Type(() => XuatKhoItemDto)
    items: XuatKhoItemDto[];

    @ApiPropertyOptional({
        description: 'Lý do chuyển kho',
        example: 'Bổ sung hàng cho kho xe',
    })
    @IsOptional()
    @IsString({ message: 'Lý do phải là chuỗi' })
    @Transform(({ value }) => value?.trim())
    ly_do?: string;
}

// ============================================================
// QUERY DTOs
// ============================================================

/**
 * Query params cho danh sách tồn kho
 */
export class QueryTonKhoDto {
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

    @ApiProperty({
        description: 'ID kho (bắt buộc)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID kho không được để trống' })
    @IsUUID('4', { message: 'ID kho phải là UUID hợp lệ' })
    kho_id: string;

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm (tên sản phẩm, mã SP)',
        example: 'Bộ vệ sinh',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;

    @ApiPropertyOptional({
        description: 'Chỉ lấy sản phẩm sắp hết hàng (số lượng thấp)',
        example: true,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    sap_het_hang?: boolean;
}

/**
 * Query params cho thẻ kho (lịch sử biến động)
 */
export class QueryTheKhoDto {
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

    @ApiProperty({
        description: 'ID kho',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID kho không được để trống' })
    @IsUUID('4', { message: 'ID kho phải là UUID hợp lệ' })
    kho_id: string;

    @ApiProperty({
        description: 'ID sản phẩm',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    @IsNotEmpty({ message: 'ID sản phẩm không được để trống' })
    @IsUUID('4', { message: 'ID sản phẩm phải là UUID hợp lệ' })
    san_pham_id: string;

    @ApiPropertyOptional({
        description: 'Từ ngày (ISO date)',
        example: '2025-01-01',
    })
    @IsOptional()
    @IsString()
    tu_ngay?: string;

    @ApiPropertyOptional({
        description: 'Đến ngày (ISO date)',
        example: '2025-12-31',
    })
    @IsOptional()
    @IsString()
    den_ngay?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo loại phiếu',
        enum: LoaiPhieuKho,
    })
    @IsOptional()
    @IsEnum(LoaiPhieuKho)
    loai_phieu?: LoaiPhieuKho;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Response DTO cho sản phẩm (embedded trong tồn kho)
 * Đổi tên để tránh conflict với QuoteMaster module
 */
export class TonKhoSanPhamEmbeddedDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'SP-001' })
    ma_san_pham: string;

    @ApiProperty({ example: 'Bộ vệ sinh máy lạnh' })
    ten_san_pham: string;

    @ApiPropertyOptional({ example: 'Bộ' })
    don_vi_tinh?: string;
}

/**
 * Response DTO cho tồn kho
 */
export class TonKhoResponseDto {
    @ApiProperty({ description: 'ID tồn kho' })
    id: string;

    @ApiProperty({ description: 'ID kho' })
    id_kho: string;

    @ApiProperty({ description: 'ID sản phẩm' })
    id_san_pham: string;

    @ApiProperty({ description: 'Số lượng tồn', example: 50 })
    so_luong: number;

    @ApiProperty({ description: 'Số lượng đã đặt trước', example: 5 })
    so_luong_dat_truoc: number;

    @ApiProperty({
        description: 'Số lượng khả dụng (tồn - đặt trước)',
        example: 45,
    })
    so_luong_kha_dung: number;

    @ApiProperty({
        description: 'Thông tin sản phẩm',
        type: TonKhoSanPhamEmbeddedDto,
    })
    san_pham: TonKhoSanPhamEmbeddedDto;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;
}

/**
 * Response DTO cho lịch sử kho (thẻ kho)
 */
export class LichSuKhoResponseDto {
    @ApiProperty({ description: 'ID lịch sử' })
    id: string;

    @ApiProperty({ description: 'Mã phiếu', example: 'NK-1704585600000' })
    ma_phieu: string;

    @ApiProperty({ description: 'Loại phiếu', enum: LoaiPhieuKho })
    loai_phieu: LoaiPhieuKho;

    @ApiProperty({ description: 'Số lượng', example: 10 })
    so_luong: number;

    @ApiPropertyOptional({ description: 'Đơn giá', example: 50000 })
    don_gia?: number;

    @ApiPropertyOptional({ description: 'Lý do' })
    ly_do?: string;

    @ApiPropertyOptional({ description: 'Thông tin sản phẩm' })
    san_pham?: TonKhoSanPhamEmbeddedDto;

    @ApiPropertyOptional({ description: 'Thông tin kho đích (cho chuyển kho)' })
    kho_den?: { id: string; ten_kho: string };

    @ApiPropertyOptional({ description: 'Thông tin công việc liên quan' })
    cong_viec?: { id: string; ma_cong_viec: string; tieu_de: string };

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;
}

/**
 * Response cho danh sách tồn kho có phân trang
 */
export class TonKhoListResponseDto {
    @ApiProperty({ type: [TonKhoResponseDto] })
    data: TonKhoResponseDto[];

    @ApiProperty({
        description: 'Thông tin phân trang',
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Response cho phiếu nhập/xuất/chuyển kho
 */
export class PhieuKhoResponseDto {
    @ApiProperty({ description: 'Mã phiếu', example: 'NK-1704585600000' })
    ma_phieu: string;

    @ApiProperty({ description: 'Loại phiếu', enum: LoaiPhieuKho })
    loai_phieu: LoaiPhieuKho;

    @ApiProperty({ description: 'Số lượng items đã xử lý', example: 3 })
    so_items: number;

    @ApiProperty({ description: 'Tổng số lượng', example: 50 })
    tong_so_luong: number;

    @ApiPropertyOptional({ description: 'Lý do' })
    ly_do?: string;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({
        description: 'Chi tiết các items',
        type: [LichSuKhoResponseDto],
    })
    chi_tiet: LichSuKhoResponseDto[];
}
