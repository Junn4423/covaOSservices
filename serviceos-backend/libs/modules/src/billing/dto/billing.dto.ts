/**
 * ============================================================
 * DTOs - Billing Module (Thanh toán SaaS)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Phase 14: Quản lý Gói cước SaaS
 * - Quản lý gói cước
 * - Lịch sử thanh toán
 * - Gia hạn & nâng cấp
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsNotEmpty,
    MaxLength,
    IsNumber,
    Min,
    IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Gói cước SaaS - match với Prisma enum
 */
export enum GoiCuocEnum {
    TRIAL = 'trial',
    BASIC = 'basic',
    PRO = 'pro',
    ENTERPRISE = 'enterprise',
}

/**
 * Chu kỳ thanh toán
 */
export enum ChuKyThanhToanEnum {
    THANG = 'thang',
    NAM = 'nam',
}

/**
 * Loại tiền tệ
 */
export enum LoaiTienEnum {
    VND = 'VND',
    USD = 'USD',
}

/**
 * Phương thức thanh toán
 */
export enum PhuongThucThanhToan {
    CHUYEN_KHOAN = 'chuyen_khoan',
    THE = 'the',
    TIEN_MAT = 'tien_mat',
    GATEWAY = 'gateway',
}

/**
 * Trạng thái thanh toán
 */
export enum TrangThaiThanhToan {
    CHO_XU_LY = 0,
    THANH_CONG = 1,
    THAT_BAI = 2,
    HUY = 3,
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Transform Prisma Decimal output thành number cho response
 */
export function billingDecimalToNumber(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

// ============================================================
// SUBSCRIPTION DTOs
// ============================================================

/**
 * DTO nâng cấp gói cước
 */
export class UpgradeSubscriptionDto {
    @ApiProperty({
        description: 'Gói cước mới cần nâng cấp',
        enum: GoiCuocEnum,
        example: GoiCuocEnum.PRO,
    })
    @IsNotEmpty({ message: 'Gói cước mới không được để trống' })
    @IsEnum(GoiCuocEnum, {
        message: 'Gói cước phải là một trong các giá trị: trial, basic, pro, enterprise',
    })
    goi_cuoc_moi: GoiCuocEnum;

    @ApiProperty({
        description: 'Chu kỳ thanh toán: tháng hoặc năm',
        enum: ChuKyThanhToanEnum,
        example: ChuKyThanhToanEnum.THANG,
    })
    @IsNotEmpty({ message: 'Chu kỳ thanh toán không được để trống' })
    @IsEnum(ChuKyThanhToanEnum, {
        message: 'Chu kỳ phải là một trong các giá trị: thang, nam',
    })
    chu_ky: ChuKyThanhToanEnum;
}

/**
 * DTO hủy gói cước
 */
export class CancelSubscriptionDto {
    @ApiPropertyOptional({
        description: 'Lý do hủy gói cước',
        example: 'Không còn nhu cầu sử dụng',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'Lý do phải là chuỗi ký tự' })
    @MaxLength(500, { message: 'Lý do tối đa 500 ký tự' })
    ly_do?: string;
}

// ============================================================
// MANUAL PAYMENT DTO
// ============================================================

/**
 * DTO tạo thanh toán thủ công (Admin B2B)
 */
export class ManualPaymentDto {
    @ApiProperty({
        description: 'Số tiền thanh toán',
        example: 1500000,
        minimum: 1,
    })
    @IsNotEmpty({ message: 'Số tiền không được để trống' })
    @IsNumber({}, { message: 'Số tiền phải là số' })
    @Min(1, { message: 'Số tiền phải lớn hơn 0' })
    @Type(() => Number)
    so_tien: number;

    @ApiProperty({
        description: 'Loại tiền tệ',
        enum: LoaiTienEnum,
        example: LoaiTienEnum.VND,
    })
    @IsNotEmpty({ message: 'Loại tiền không được để trống' })
    @IsEnum(LoaiTienEnum, {
        message: 'Loại tiền phải là một trong các giá trị: VND, USD',
    })
    loai_tien: LoaiTienEnum;

    @ApiProperty({
        description: 'Phương thức thanh toán',
        enum: PhuongThucThanhToan,
        example: PhuongThucThanhToan.CHUYEN_KHOAN,
    })
    @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
    @IsEnum(PhuongThucThanhToan, {
        message: 'Phương thức thanh toán không hợp lệ',
    })
    phuong_thuc: PhuongThucThanhToan;

    @ApiPropertyOptional({
        description: 'Mã giao dịch từ ngân hàng/cổng thanh toán',
        example: 'FT24010100001',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Mã giao dịch phải là chuỗi ký tự' })
    @MaxLength(100, { message: 'Mã giao dịch tối đa 100 ký tự' })
    @Transform(({ value }) => value?.trim())
    ma_giao_dich?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú thanh toán',
        example: 'Thanh toán gia hạn gói Pro 12 tháng',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
    @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
    @Transform(({ value }) => value?.trim())
    ghi_chu?: string;

    @ApiProperty({
        description: 'Gói cước áp dụng',
        enum: GoiCuocEnum,
        example: GoiCuocEnum.PRO,
    })
    @IsNotEmpty({ message: 'Gói cước không được để trống' })
    @IsEnum(GoiCuocEnum, {
        message: 'Gói cước phải là một trong các giá trị: trial, basic, pro, enterprise',
    })
    goi_cuoc: GoiCuocEnum;

    @ApiProperty({
        description: 'Chu kỳ thanh toán',
        enum: ChuKyThanhToanEnum,
        example: ChuKyThanhToanEnum.NAM,
    })
    @IsNotEmpty({ message: 'Chu kỳ thanh toán không được để trống' })
    @IsEnum(ChuKyThanhToanEnum, {
        message: 'Chu kỳ phải là một trong các giá trị: thang, nam',
    })
    chu_ky: ChuKyThanhToanEnum;

    @ApiProperty({
        description: 'ID doanh nghiệp cần gia hạn (chỉ Admin hệ thống)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID doanh nghiệp không được để trống' })
    @IsString({ message: 'ID doanh nghiệp phải là chuỗi ký tự' })
    id_doanh_nghiep: string;
}

// ============================================================
// QUERY DTOs
// ============================================================

/**
 * DTO query lịch sử thanh toán
 */
export class QueryBillingHistoryDto {
    @ApiPropertyOptional({
        description: 'Lọc từ ngày (định dạng: YYYY-MM-DD)',
        example: '2026-01-01',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ (định dạng: YYYY-MM-DD)' })
    tu_ngay?: string;

    @ApiPropertyOptional({
        description: 'Lọc đến ngày (định dạng: YYYY-MM-DD)',
        example: '2026-12-31',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ (định dạng: YYYY-MM-DD)' })
    den_ngay?: string;

    @ApiPropertyOptional({
        description: 'Trạng thái thanh toán: 0=Chờ xử lý, 1=Thành công, 2=Thất bại, 3=Hủy',
        enum: [0, 1, 2, 3],
        example: 1,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Trạng thái phải là số' })
    @Type(() => Number)
    trang_thai?: number;

    @ApiPropertyOptional({
        description: 'Số trang (bắt đầu từ 1)',
        example: 1,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Số trang phải là số' })
    @Min(1, { message: 'Số trang phải lớn hơn 0' })
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số bản ghi mỗi trang',
        example: 20,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Số bản ghi phải là số' })
    @Min(1, { message: 'Số bản ghi phải lớn hơn 0' })
    @Type(() => Number)
    limit?: number = 20;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Response thông tin gói cước hiện tại
 */
export class SubscriptionInfoResponse {
    @ApiProperty({ description: 'ID doanh nghiệp' })
    id_doanh_nghiep: string;

    @ApiProperty({ description: 'Tên doanh nghiệp' })
    ten_doanh_nghiep: string;

    @ApiProperty({ description: 'Gói cước hiện tại', enum: GoiCuocEnum })
    goi_cuoc: GoiCuocEnum;

    @ApiProperty({ description: 'Trạng thái: 1=Hoạt động, 2=Tạm khóa, 0=Chưa kích hoạt' })
    trang_thai: number;

    @ApiProperty({ description: 'Ngày hết hạn gói cước', nullable: true })
    ngay_het_han_goi: Date | null;

    @ApiProperty({ description: 'Số ngày còn lại', nullable: true })
    so_ngay_con_lai: number | null;

    @ApiProperty({ description: 'Trạng thái hết hạn' })
    da_het_han: boolean;
}

/**
 * Response lịch sử thanh toán
 */
export class BillingHistoryItemResponse {
    @ApiProperty({ description: 'ID thanh toán' })
    id: string;

    @ApiProperty({ description: 'Mã hóa đơn' })
    ma_hoa_don: string | null;

    @ApiProperty({ description: 'Số tiền' })
    so_tien: number;

    @ApiProperty({ description: 'Loại tiền' })
    loai_tien: string;

    @ApiProperty({ description: 'Gói cước', enum: GoiCuocEnum })
    goi_cuoc: GoiCuocEnum;

    @ApiProperty({ description: 'Chu kỳ thanh toán' })
    chu_ky: string;

    @ApiProperty({ description: 'Từ ngày' })
    tu_ngay: Date;

    @ApiProperty({ description: 'Đến ngày' })
    den_ngay: Date;

    @ApiProperty({ description: 'Phương thức thanh toán' })
    phuong_thuc: string | null;

    @ApiProperty({ description: 'Mã giao dịch cổng thanh toán' })
    ma_giao_dich_cong: string | null;

    @ApiProperty({ description: 'Trạng thái: 0=Chờ, 1=Thành công, 2=Thất bại, 3=Hủy' })
    trang_thai: number;

    @ApiProperty({ description: 'Ghi chú' })
    ghi_chu: string | null;

    @ApiProperty({ description: 'Ngày thanh toán' })
    ngay_thanh_toan: Date | null;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;
}
