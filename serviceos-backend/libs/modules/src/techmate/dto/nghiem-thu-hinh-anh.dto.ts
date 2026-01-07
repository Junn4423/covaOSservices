/**
 * ============================================================
 * NGHIỆM THU HÌNH ẢNH DTOs - TechMate Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * DTOs cho quản lý hình ảnh nghiệm thu công việc bao gồm:
 * - LoaiAnh enum (TRUOC, SAU, QUA_TRINH)
 * - AddEvidenceDto: Thêm ảnh nghiệm thu
 * - NghiemThuHinhAnhResponseDto: Response
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    IsEnum,
    IsNumber,
    IsUrl,
    MaxLength,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Loại ảnh nghiệm thu
 * - TRUOC: Ảnh chụp trước khi làm
 * - SAU: Ảnh chụp sau khi hoàn thành
 * - QUA_TRINH: Ảnh chụp trong quá trình làm
 */
export enum LoaiAnh {
    TRUOC = 'truoc',
    SAU = 'sau',
    QUA_TRINH = 'qua_trinh',
}

export const LoaiAnhLabels: Record<LoaiAnh, string> = {
    [LoaiAnh.TRUOC]: 'Trước khi làm',
    [LoaiAnh.SAU]: 'Sau khi hoàn thành',
    [LoaiAnh.QUA_TRINH]: 'Quá trình thực hiện',
};

// ============================================================
// ADD EVIDENCE DTO
// ============================================================

export class AddEvidenceDto {
    @ApiProperty({
        description: 'URL hình ảnh (từ Cloud Storage)',
        example: 'https://storage.googleapis.com/bucket/image.jpg',
        maxLength: 500,
    })
    @IsString()
    @IsNotEmpty({ message: 'URL ảnh không được để trống' })
    @MaxLength(500, { message: 'URL ảnh tối đa 500 ký tự' })
    url_anh: string;

    @ApiPropertyOptional({
        description: 'Loại ảnh nghiệm thu',
        enum: LoaiAnh,
        example: 'truoc',
        default: 'truoc',
    })
    @IsOptional()
    @IsEnum(LoaiAnh, { message: 'Loại ảnh phải là: truoc, sau, qua_trinh' })
    loai_anh?: LoaiAnh = LoaiAnh.TRUOC;

    @ApiPropertyOptional({
        description: 'Mô tả ngắn về hình ảnh',
        example: 'Điều hòa trước khi sửa - bị rò gas',
        maxLength: 255,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    mo_ta?: string;

    @ApiPropertyOptional({
        description: 'Tọa độ vĩ độ nơi chụp ảnh (Latitude)',
        example: 10.7285,
        minimum: -90,
        maximum: 90,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Tọa độ vĩ độ phải là số' })
    @Type(() => Number)
    @Min(-90)
    @Max(90)
    toa_do_lat?: number;

    @ApiPropertyOptional({
        description: 'Tọa độ kinh độ nơi chụp ảnh (Longitude)',
        example: 106.7217,
        minimum: -180,
        maximum: 180,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Tọa độ kinh độ phải là số' })
    @Type(() => Number)
    @Min(-180)
    @Max(180)
    toa_do_lng?: number;
}

// ============================================================
// BULK ADD EVIDENCE DTO
// ============================================================

export class BulkAddEvidenceDto {
    @ApiProperty({
        description: 'Danh sách hình ảnh nghiệm thu',
        type: [AddEvidenceDto],
    })
    images: AddEvidenceDto[];
}

// ============================================================
// QUERY DTO
// ============================================================

export class QueryNghiemThuHinhAnhDto {
    @ApiPropertyOptional({
        description: 'Lọc theo loại ảnh',
        enum: LoaiAnh,
    })
    @IsOptional()
    @IsEnum(LoaiAnh)
    loai_anh?: LoaiAnh;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

export class NghiemThuHinhAnhResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id_cong_viec: string;

    @ApiProperty({ example: 'https://storage.googleapis.com/bucket/image.jpg' })
    url_anh: string;

    @ApiProperty({ enum: LoaiAnh, example: 'truoc' })
    loai_anh: LoaiAnh;

    @ApiPropertyOptional({ example: 'Ảnh điều hòa trước khi sửa' })
    mo_ta?: string;

    @ApiPropertyOptional({ example: 10.7285 })
    toa_do_lat?: number;

    @ApiPropertyOptional({ example: 106.7217 })
    toa_do_lng?: number;

    @ApiProperty()
    ngay_tao: Date;

    @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
    nguoi_tao_id?: string;
}

export class NghiemThuHinhAnhListResponseDto {
    @ApiProperty({ type: [NghiemThuHinhAnhResponseDto] })
    data: NghiemThuHinhAnhResponseDto[];

    @ApiProperty({ example: 10 })
    total: number;

    @ApiProperty({
        description: 'Số lượng ảnh theo loại',
        example: { truoc: 3, sau: 5, qua_trinh: 2 },
    })
    by_type: Record<LoaiAnh, number>;
}
