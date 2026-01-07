/**
 * ============================================================
 * ĐƠN ĐẶT HÀNG NCC DTOs - ProcurePool Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * DTOs for Purchase Order Management (DonDatHangNcc)
 * Phase 10: ProcurePool - Procurement Management
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsUUID,
    IsInt,
    Min,
    Max,
    IsNumber,
    IsArray,
    ValidateNested,
    IsEnum,
    IsDateString,
    ArrayMinSize,
    MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Trạng thái đơn đặt hàng NCC
 * DRAFT = 0: Nháp (chưa gửi)
 * ORDERED = 1: Đã đặt (đang chờ giao)
 * RECEIVED = 2: Đã nhận hàng (hoàn thành)
 * CANCELLED = 3: Đã hủy
 */
export enum TrangThaiDonHangNCC {
    DRAFT = 0,
    ORDERED = 1,
    RECEIVED = 2,
    CANCELLED = 3,
}

// ============================================================
// NESTED DTOs
// ============================================================

/**
 * Chi tiết đơn đặt hàng (item)
 */
export class ChiTietDonDatHangDto {
    @ApiProperty({
        description: 'ID sản phẩm',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    san_pham_id: string;

    @ApiProperty({
        description: 'Số lượng đặt',
        example: 10,
        minimum: 1,
    })
    @IsInt()
    @Min(1, { message: 'Số lượng phải lớn hơn 0' })
    so_luong: number;

    @ApiProperty({
        description: 'Đơn giá',
        example: 150000,
        minimum: 0,
    })
    @IsNumber()
    @Min(0, { message: 'Đơn giá không được âm' })
    don_gia: number;

    @ApiPropertyOptional({
        description: 'Ghi chú cho item',
        example: 'Màu trắng',
    })
    @IsOptional()
    @IsString()
    ghi_chu?: string;
}

// ============================================================
// CREATE / UPDATE DTOs
// ============================================================

/**
 * DTO tạo đơn đặt hàng mới (Purchase Order)
 */
export class CreateDonDatHangDto {
    @ApiProperty({
        description: 'ID nhà cung cấp',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    nha_cung_cap_id: string;

    @ApiPropertyOptional({
        description: 'Mã đơn hàng (tự sinh nếu không nhập)',
        example: 'PO-2026-001',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    ma_don_hang?: string;

    @ApiPropertyOptional({
        description: 'Ngày dự kiến giao hàng',
        example: '2026-01-15',
    })
    @IsOptional()
    @IsDateString()
    ngay_giao_du_kien?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú đơn hàng',
        example: 'Giao hàng buổi sáng',
    })
    @IsOptional()
    @IsString()
    ghi_chu?: string;

    @ApiPropertyOptional({
        description: 'Trạng thái ban đầu (mặc định: DRAFT)',
        example: TrangThaiDonHangNCC.DRAFT,
        enum: [TrangThaiDonHangNCC.DRAFT, TrangThaiDonHangNCC.ORDERED],
        default: TrangThaiDonHangNCC.DRAFT,
    })
    @IsOptional()
    @IsEnum([TrangThaiDonHangNCC.DRAFT, TrangThaiDonHangNCC.ORDERED])
    trang_thai?: TrangThaiDonHangNCC = TrangThaiDonHangNCC.DRAFT;

    @ApiProperty({
        description: 'Danh sách chi tiết đơn hàng',
        type: [ChiTietDonDatHangDto],
        minItems: 1,
    })
    @IsArray()
    @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 sản phẩm' })
    @ValidateNested({ each: true })
    @Type(() => ChiTietDonDatHangDto)
    items: ChiTietDonDatHangDto[];
}

/**
 * DTO cập nhật đơn đặt hàng (chỉ cho đơn DRAFT)
 */
export class UpdateDonDatHangDto {
    @ApiPropertyOptional({
        description: 'Ngày dự kiến giao hàng',
        example: '2026-01-20',
    })
    @IsOptional()
    @IsDateString()
    ngay_giao_du_kien?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú đơn hàng',
        example: 'Cập nhật: Giao hàng chiều',
    })
    @IsOptional()
    @IsString()
    ghi_chu?: string;

    @ApiPropertyOptional({
        description: 'Danh sách chi tiết đơn hàng (thay thế toàn bộ)',
        type: [ChiTietDonDatHangDto],
    })
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 sản phẩm' })
    @ValidateNested({ each: true })
    @Type(() => ChiTietDonDatHangDto)
    items?: ChiTietDonDatHangDto[];
}

/**
 * DTO chuyển trạng thái sang ORDERED
 */
export class ConfirmOrderDto {
    @ApiPropertyOptional({
        description: 'Ngày đặt hàng (mặc định: now)',
        example: '2026-01-10',
    })
    @IsOptional()
    @IsDateString()
    ngay_dat?: string;
}

/**
 * DTO nhận hàng (Goods Receipt) -  KEY INTEGRATION
 */
export class ReceiveGoodsDto {
    @ApiProperty({
        description: 'ID kho để nhập hàng vào',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID()
    kho_nhap_id: string;

    @ApiPropertyOptional({
        description: 'Ghi chú khi nhận hàng',
        example: 'Kiểm tra OK, đủ số lượng',
    })
    @IsOptional()
    @IsString()
    ghi_chu?: string;
}

/**
 * DTO hủy đơn hàng
 */
export class CancelOrderDto {
    @ApiProperty({
        description: 'Lý do hủy đơn',
        example: 'NCC không còn hàng',
    })
    @IsString()
    ly_do_huy: string;
}

// ============================================================
// QUERY DTOs
// ============================================================

/**
 * DTO query danh sách đơn đặt hàng
 */
export class QueryDonDatHangDto {
    @ApiPropertyOptional({
        description: 'Trang hiện tại',
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số lượng mỗi trang',
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm (mã đơn)',
        example: 'PO-2026',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo nhà cung cấp',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID()
    nha_cung_cap_id?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái',
        example: TrangThaiDonHangNCC.ORDERED,
        enum: TrangThaiDonHangNCC,
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(TrangThaiDonHangNCC)
    trang_thai?: TrangThaiDonHangNCC;

    @ApiPropertyOptional({
        description: 'Lọc từ ngày đặt',
        example: '2026-01-01',
    })
    @IsOptional()
    @IsDateString()
    tu_ngay?: string;

    @ApiPropertyOptional({
        description: 'Lọc đến ngày đặt',
        example: '2026-01-31',
    })
    @IsOptional()
    @IsDateString()
    den_ngay?: string;

    @ApiPropertyOptional({
        description: 'Sắp xếp theo trường',
        example: 'ngay_tao',
        default: 'ngay_tao',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'ngay_tao';

    @ApiPropertyOptional({
        description: 'Thứ tự sắp xếp',
        example: 'desc',
        default: 'desc',
        enum: ['asc', 'desc'],
    })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Response DTO cho chi tiết đơn hàng
 */
export class ChiTietDonDatHangResponseDto {
    @ApiProperty({ description: 'ID chi tiết' })
    id: string;

    @ApiPropertyOptional({ description: 'ID sản phẩm' })
    id_san_pham?: string;

    @ApiPropertyOptional({ description: 'Tên sản phẩm' })
    ten_san_pham?: string;

    @ApiProperty({ description: 'Số lượng đặt' })
    so_luong: number;

    @ApiProperty({ description: 'Đơn giá' })
    don_gia: number;

    @ApiProperty({ description: 'Thành tiền' })
    thanh_tien: number;

    @ApiProperty({ description: 'Số lượng đã nhận' })
    so_luong_da_nhan: number;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiPropertyOptional({
        description: 'Thông tin sản phẩm',
    })
    san_pham?: {
        id: string;
        ma_san_pham: string;
        ten_san_pham: string;
        don_vi_tinh?: string;
    };
}

/**
 * Response DTO cho đơn đặt hàng
 */
export class DonDatHangResponseDto {
    @ApiProperty({ description: 'ID đơn hàng' })
    id: string;

    @ApiPropertyOptional({ description: 'Mã đơn hàng', example: 'PO-2026-001' })
    ma_don_hang?: string;

    @ApiProperty({ description: 'ID nhà cung cấp' })
    id_nha_cung_cap: string;

    @ApiPropertyOptional({ description: 'ID kho nhập' })
    id_kho?: string;

    @ApiPropertyOptional({ description: 'Ngày đặt hàng' })
    ngay_dat?: Date;

    @ApiPropertyOptional({ description: 'Ngày giao dự kiến' })
    ngay_giao_du_kien?: Date;

    @ApiPropertyOptional({ description: 'Ngày giao thực tế' })
    ngay_giao_thuc_te?: Date;

    @ApiProperty({ description: 'Tổng tiền' })
    tong_tien: number;

    @ApiProperty({
        description: 'Trạng thái',
        enum: TrangThaiDonHangNCC,
        example: TrangThaiDonHangNCC.ORDERED,
    })
    trang_thai: TrangThaiDonHangNCC;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;

    @ApiPropertyOptional({
        description: 'Thông tin nhà cung cấp',
    })
    nha_cung_cap?: {
        id: string;
        ma_ncc?: string;
        ten_nha_cung_cap: string;
        so_dien_thoai?: string;
    };

    @ApiPropertyOptional({
        description: 'Thông tin kho nhập',
    })
    kho?: {
        id: string;
        ten_kho: string;
    };

    @ApiPropertyOptional({
        description: 'Danh sách chi tiết',
        type: [ChiTietDonDatHangResponseDto],
    })
    chi_tiet?: ChiTietDonDatHangResponseDto[];
}

/**
 * Response cho danh sách đơn hàng có phân trang
 */
export class DonDatHangListResponseDto {
    @ApiProperty({ type: [DonDatHangResponseDto] })
    data: DonDatHangResponseDto[];

    @ApiProperty({ description: 'Thông tin phân trang' })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Response cho thống kê đơn hàng
 */
export class DonDatHangStatsDto {
    @ApiProperty({ description: 'Tổng số đơn hàng' })
    tong_don_hang: number;

    @ApiProperty({ description: 'Số đơn nháp' })
    don_nhap: number;

    @ApiProperty({ description: 'Số đơn đã đặt (đang chờ)' })
    don_dang_cho: number;

    @ApiProperty({ description: 'Số đơn đã nhận' })
    don_da_nhan: number;

    @ApiProperty({ description: 'Số đơn đã hủy' })
    don_da_huy: number;

    @ApiProperty({ description: 'Tổng giá trị đơn đã đặt + đã nhận' })
    tong_gia_tri: number;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Chuyển đổi Decimal thành number cho response
 */
export function decimalToNumberPO(value: any): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value.toNumber) {
        return value.toNumber();
    }
    return parseFloat(value.toString()) || 0;
}

/**
 * Lấy label cho trạng thái
 */
export function getTrangThaiLabel(trangThai: TrangThaiDonHangNCC): string {
    const labels = {
        [TrangThaiDonHangNCC.DRAFT]: 'Nháp',
        [TrangThaiDonHangNCC.ORDERED]: 'Đã đặt',
        [TrangThaiDonHangNCC.RECEIVED]: 'Đã nhận',
        [TrangThaiDonHangNCC.CANCELLED]: 'Đã hủy',
    };
    return labels[trangThai] || 'Không xác định';
}
