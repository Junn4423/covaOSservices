/**
 * ============================================================
 * DTOs - StockPile Nhóm Sản Phẩm Module
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    IsInt,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// CREATE DTO
// ============================================================

/**
 * DTO để tạo nhóm sản phẩm mới
 */
export class CreateNhomSanPhamDto {
    @ApiProperty({
        description: 'Tên nhóm sản phẩm',
        example: 'Dịch vụ máy lạnh',
        maxLength: 255,
    })
    @IsNotEmpty({ message: 'Tên nhóm không được để trống' })
    @IsString({ message: 'Tên nhóm phải là chuỗi' })
    @MaxLength(255, { message: 'Tên nhóm tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim())
    ten_nhom: string;

    @ApiPropertyOptional({
        description: 'Mô tả nhóm sản phẩm',
        example: 'Các dịch vụ liên quan đến bảo trì, sửa chữa máy lạnh',
    })
    @IsOptional()
    @IsString({ message: 'Mô tả phải là chuỗi' })
    mo_ta?: string;

    @ApiPropertyOptional({
        description: 'Thứ tự hiển thị (số nhỏ hơn hiển thị trước)',
        example: 1,
        default: 0,
    })
    @IsOptional()
    @IsInt({ message: 'Thứ tự phải là số nguyên' })
    @Min(0, { message: 'Thứ tự phải >= 0' })
    @Type(() => Number)
    thu_tu?: number;
}

// ============================================================
// UPDATE DTO
// ============================================================

/**
 * DTO để cập nhật nhóm sản phẩm
 */
export class UpdateNhomSanPhamDto extends PartialType(CreateNhomSanPhamDto) { }

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Query params cho danh sách nhóm sản phẩm
 */
export class QueryNhomSanPhamDto {
    @ApiPropertyOptional({
        description: 'Số trang',
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số items mỗi trang',
        default: 50,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 50;

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm',
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
 * Response DTO cho một nhóm sản phẩm
 */
export class NhomSanPhamResponseDto {
    @ApiProperty({ description: 'ID nhóm (UUID)' })
    id: string;

    @ApiProperty({ description: 'Tên nhóm' })
    ten_nhom: string;

    @ApiPropertyOptional({ description: 'Mô tả' })
    mo_ta?: string;

    @ApiProperty({ description: 'Thứ tự hiển thị' })
    thu_tu: number;

    @ApiProperty({ description: 'Số lượng sản phẩm trong nhóm' })
    so_san_pham?: number;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;
}

/**
 * Response cho danh sách nhóm sản phẩm
 */
export class NhomSanPhamListResponseDto {
    @ApiProperty({ type: [NhomSanPhamResponseDto] })
    data: NhomSanPhamResponseDto[];

    @ApiProperty()
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
