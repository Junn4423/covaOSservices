/**
 * ============================================================
 * NHÀ CUNG CẤP DTOs - ProcurePool Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * DTOs for Supplier Management (NhaCungCap)
 * Phase 10: ProcurePool - Procurement Management
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEmail,
    IsUUID,
    MaxLength,
    IsInt,
    Min,
    Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ============================================================
// CREATE / UPDATE DTOs
// ============================================================

/**
 * DTO tạo nhà cung cấp mới
 */
export class CreateNhaCungCapDto {
    @ApiProperty({
        description: 'Tên nhà cung cấp',
        example: 'Công ty TNHH Thiết bị Điện lạnh ABC',
        maxLength: 255,
    })
    @IsString()
    @MaxLength(255)
    ten_nha_cung_cap: string;

    @ApiPropertyOptional({
        description: 'Mã nhà cung cấp (tự sinh nếu không nhập)',
        example: 'NCC-001',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    ma_ncc?: string;

    @ApiPropertyOptional({
        description: 'Tên người liên hệ',
        example: 'Nguyễn Văn A',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    nguoi_lien_he?: string;

    @ApiPropertyOptional({
        description: 'Email',
        example: 'contact@abc-dientlanh.com',
        maxLength: 255,
    })
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @ApiPropertyOptional({
        description: 'Số điện thoại',
        example: '0901234567',
        maxLength: 20,
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    so_dien_thoai?: string;

    @ApiPropertyOptional({
        description: 'Địa chỉ',
        example: '123 Nguyễn Huệ, Q1, TP.HCM',
    })
    @IsOptional()
    @IsString()
    dia_chi?: string;

    @ApiPropertyOptional({
        description: 'Mã số thuế',
        example: '0123456789',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    ma_so_thue?: string;

    @ApiPropertyOptional({
        description: 'Số tài khoản ngân hàng',
        example: '1234567890123',
        maxLength: 50,
    })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    so_tai_khoan?: string;

    @ApiPropertyOptional({
        description: 'Tên ngân hàng',
        example: 'Vietcombank - CN TP.HCM',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    ngan_hang?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú',
        example: 'NCC uy tín, giao hàng đúng hẹn',
    })
    @IsOptional()
    @IsString()
    ghi_chu?: string;
}

/**
 * DTO cập nhật nhà cung cấp (partial)
 */
export class UpdateNhaCungCapDto extends PartialType(CreateNhaCungCapDto) {
    @ApiPropertyOptional({
        description: 'Trạng thái (1: Hoạt động, 0: Ngưng)',
        example: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1)
    trang_thai?: number;
}

// ============================================================
// QUERY DTOs
// ============================================================

/**
 * DTO query danh sách nhà cung cấp
 */
export class QueryNhaCungCapDto {
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
        description: 'Từ khóa tìm kiếm (tên, mã, email, SĐT)',
        example: 'ABC',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái (1: Hoạt động, 0: Ngưng)',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @Max(1)
    trang_thai?: number;

    @ApiPropertyOptional({
        description: 'Sắp xếp theo trường',
        example: 'ten_nha_cung_cap',
        default: 'ngay_tao',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'ngay_tao';

    @ApiPropertyOptional({
        description: 'Thứ tự sắp xếp',
        example: 'asc',
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
 * Response DTO cho nhà cung cấp
 */
export class NhaCungCapResponseDto {
    @ApiProperty({ description: 'ID nhà cung cấp' })
    id: string;

    @ApiPropertyOptional({ description: 'Mã NCC', example: 'NCC-001' })
    ma_ncc?: string;

    @ApiProperty({
        description: 'Tên nhà cung cấp',
        example: 'Công ty TNHH Thiết bị Điện lạnh ABC',
    })
    ten_nha_cung_cap: string;

    @ApiPropertyOptional({ description: 'Người liên hệ' })
    nguoi_lien_he?: string;

    @ApiPropertyOptional({ description: 'Email' })
    email?: string;

    @ApiPropertyOptional({ description: 'Số điện thoại' })
    so_dien_thoai?: string;

    @ApiPropertyOptional({ description: 'Địa chỉ' })
    dia_chi?: string;

    @ApiPropertyOptional({ description: 'Mã số thuế' })
    ma_so_thue?: string;

    @ApiPropertyOptional({ description: 'Số tài khoản' })
    so_tai_khoan?: string;

    @ApiPropertyOptional({ description: 'Ngân hàng' })
    ngan_hang?: string;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiProperty({ description: 'Trạng thái (1: Hoạt động, 0: Ngưng)' })
    trang_thai: number;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;
}

/**
 * Response cho danh sách nhà cung cấp có phân trang
 */
export class NhaCungCapListResponseDto {
    @ApiProperty({ type: [NhaCungCapResponseDto] })
    data: NhaCungCapResponseDto[];

    @ApiProperty({ description: 'Thông tin phân trang' })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
