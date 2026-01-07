/**
 * ============================================================
 * DTOs - StockPile Kho (Warehouse) Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  WAREHOUSE MANAGEMENT:
 * Quản lý kho hàng với các loại:
 * - CO_DINH: Kho cố định (văn phòng, nhà xưởng)
 * - XE: Kho di động trên xe nhân viên
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsNotEmpty,
    MaxLength,
    IsUUID,
    IsInt,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Loại kho - match với Prisma enum
 */
export enum LoaiKho {
    CO_DINH = 'co_dinh',
    XE = 'xe',
}

// ============================================================
// CREATE DTO
// ============================================================

/**
 * DTO để tạo kho mới
 */
export class CreateKhoDto {
    @ApiProperty({
        description: 'Tên kho',
        example: 'Kho chính - Văn phòng HCM',
        maxLength: 255,
    })
    @IsNotEmpty({ message: 'Tên kho không được để trống' })
    @IsString({ message: 'Tên kho phải là chuỗi' })
    @MaxLength(255, { message: 'Tên kho tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim())
    ten_kho: string;

    @ApiPropertyOptional({
        description: 'Loại kho',
        enum: LoaiKho,
        default: LoaiKho.CO_DINH,
    })
    @IsOptional()
    @IsEnum(LoaiKho, { message: 'Loại kho không hợp lệ (co_dinh, xe)' })
    loai_kho?: LoaiKho;

    @ApiPropertyOptional({
        description: 'Địa chỉ kho',
        example: '123 Nguyễn Huệ, Q1, TP.HCM',
    })
    @IsOptional()
    @IsString({ message: 'Địa chỉ phải là chuỗi' })
    @Transform(({ value }) => value?.trim())
    dia_chi?: string;

    @ApiPropertyOptional({
        description: 'ID người phụ trách kho (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID người phụ trách phải là UUID hợp lệ' })
    id_nguoi_phu_trach?: string;
}

// ============================================================
// UPDATE DTO
// ============================================================

/**
 * DTO để cập nhật kho - tất cả fields optional
 */
export class UpdateKhoDto extends PartialType(CreateKhoDto) { }

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Query params cho danh sách kho
 */
export class QueryKhoDto {
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
        description: 'Từ khóa tìm kiếm (theo tên kho)',
        example: 'Kho chính',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo loại kho',
        enum: LoaiKho,
    })
    @IsOptional()
    @IsEnum(LoaiKho)
    loai_kho?: LoaiKho;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Response DTO cho người phụ trách (embedded)
 */
export class NguoiPhuTrachEmbeddedDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Nguyễn Văn A' })
    ho_ten: string;

    @ApiPropertyOptional({ example: 'nguyenvana@example.com' })
    email?: string;
}

/**
 * Response DTO cho một kho
 */
export class KhoResponseDto {
    @ApiProperty({ description: 'ID kho (UUID)' })
    id: string;

    @ApiProperty({ description: 'Tên kho', example: 'Kho chính' })
    ten_kho: string;

    @ApiProperty({ description: 'Loại kho', enum: LoaiKho })
    loai_kho: LoaiKho;

    @ApiPropertyOptional({ description: 'Địa chỉ kho' })
    dia_chi?: string;

    @ApiPropertyOptional({
        description: 'Thông tin người phụ trách',
        type: NguoiPhuTrachEmbeddedDto,
    })
    nguoi_phu_trach?: NguoiPhuTrachEmbeddedDto;

    @ApiProperty({ description: 'Trạng thái (1: Active, 0: Inactive)' })
    trang_thai: number;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;
}

/**
 * Response cho danh sách kho có phân trang
 */
export class KhoListResponseDto {
    @ApiProperty({ type: [KhoResponseDto] })
    data: KhoResponseDto[];

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
