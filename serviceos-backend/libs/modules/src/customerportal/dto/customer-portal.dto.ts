/**
 * ============================================================
 * CUSTOMER PORTAL DTO - CustomerPortal Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * DTOs cho tính năng cổng khách hàng:
 * - QueryJobsDto: Lọc công việc của khách hàng
 * - QueryQuotesDto: Lọc báo giá của khách hàng
 * - CreateReviewDto: Gửi đánh giá
 * - Response DTOs cho công việc, báo giá, đánh giá
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsUUID,
    IsNumber,
    Min,
    Max,
    MaxLength,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// QUERY JOBS DTO
// ============================================================

export class QueryCustomerJobsDto {
    @ApiPropertyOptional({ description: 'Số trang', example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Số lượng mỗi trang', example: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái công việc (0=Mới, 1=Đang thực hiện, 2=Hoàn thành, 3=Hủy)',
        example: 2,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    trang_thai?: number;
}

// ============================================================
// QUERY QUOTES DTO
// ============================================================

export class QueryCustomerQuotesDto {
    @ApiPropertyOptional({ description: 'Số trang', example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Số lượng mỗi trang', example: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái báo giá',
        example: 'SENT',
        enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    })
    @IsOptional()
    @IsString()
    trang_thai?: string;
}

// ============================================================
// CREATE REVIEW DTO
// ============================================================

export class CreateReviewDto {
    @ApiProperty({
        description: 'ID công việc cần đánh giá',
        example: 'uuid-cong-viec',
    })
    @IsUUID('all', { message: 'ID công việc không hợp lệ' })
    cong_viec_id: string;

    @ApiProperty({
        description: 'Số sao đánh giá (1-5)',
        example: 5,
        minimum: 1,
        maximum: 5,
    })
    @Type(() => Number)
    @IsNumber()
    @Min(1, { message: 'Số sao phải từ 1 đến 5' })
    @Max(5, { message: 'Số sao phải từ 1 đến 5' })
    so_sao: number;

    @ApiPropertyOptional({
        description: 'Nhận xét đánh giá',
        example: 'Dịch vụ rất tốt, kỹ thuật viên thân thiện',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: 'Nhận xét quá dài' })
    nhan_xet?: string;
}

// ============================================================
// JOB RESPONSE DTO (Customer View)
// ============================================================

export class CustomerJobResponseDto {
    @ApiProperty({ example: 'uuid-cong-viec' })
    id: string;

    @ApiProperty({ example: 'CV-1704585600000' })
    ma_cong_viec: string | null;

    @ApiProperty({ example: 'Sửa máy lạnh' })
    tieu_de: string;

    @ApiPropertyOptional({ example: 'Mô tả chi tiết...' })
    mo_ta: string | null;

    @ApiProperty({ example: 2, description: '0=Mới, 1=Đang thực hiện, 2=Hoàn thành, 3=Hủy' })
    trang_thai: number;

    @ApiPropertyOptional({ example: '2026-01-10T09:00:00Z' })
    ngay_hen: Date | null;

    @ApiPropertyOptional({ example: '2026-01-10T11:30:00Z' })
    ngay_hoan_thanh: Date | null;

    @ApiPropertyOptional({ example: '123 Nguyễn Văn Linh, Q7, HCM' })
    dia_chi_lam_viec: string | null;

    @ApiProperty({ example: '2026-01-05T07:00:00Z' })
    ngay_tao: Date;

    @ApiPropertyOptional({
        description: 'Danh sách kỹ thuật viên được phân công',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                ho_ten: { type: 'string' },
                so_dien_thoai: { type: 'string' },
                la_truong_nhom: { type: 'number' },
            },
        },
    })
    phan_cong: any[];
}

// ============================================================
// QUOTE RESPONSE DTO (Customer View)
// ============================================================

export class CustomerQuoteResponseDto {
    @ApiProperty({ example: 'uuid-bao-gia' })
    id: string;

    @ApiProperty({ example: 'BG-1704585600000' })
    ma_bao_gia: string;

    @ApiPropertyOptional({ example: 'Báo giá sửa chữa máy lạnh' })
    tieu_de: string | null;

    @ApiProperty({ example: 'SENT' })
    trang_thai: string;

    @ApiProperty({ example: '2026-01-05T07:00:00Z' })
    ngay_bao_gia: Date;

    @ApiPropertyOptional({ example: '2026-01-20' })
    ngay_het_han: Date | null;

    @ApiProperty({ example: 5000000 })
    tong_tien_truoc_thue: number;

    @ApiProperty({ example: 10 })
    thue_vat: number;

    @ApiProperty({ example: 500000 })
    tien_thue: number;

    @ApiProperty({ example: 5500000 })
    tong_tien_sau_thue: number;

    @ApiPropertyOptional({ description: 'Chi tiết báo giá' })
    chi_tiet: any[];
}

// ============================================================
// REVIEW RESPONSE DTO
// ============================================================

export class ReviewResponseDto {
    @ApiProperty({ example: 'uuid-danh-gia' })
    id: string;

    @ApiProperty({ example: 'uuid-cong-viec' })
    id_cong_viec: string;

    @ApiProperty({ example: 5 })
    so_sao: number;

    @ApiPropertyOptional({ example: 'Dịch vụ rất tốt!' })
    nhan_xet: string | null;

    @ApiPropertyOptional({ example: 'Cảm ơn quý khách!' })
    phan_hoi_doanh_nghiep: string | null;

    @ApiProperty({ example: '2026-01-10T12:00:00Z' })
    ngay_tao: Date;
}
