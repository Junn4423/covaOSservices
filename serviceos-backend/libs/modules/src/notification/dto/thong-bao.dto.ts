/**
 * ============================================================
 * THÔNG BÁO DTO - Notification Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * DTOs cho quản lý thông báo bao gồm:
 * - CreateNotificationDto: Input cho phương thức nội bộ
 * - QueryNotificationDto: Lọc và phân trang danh sách
 * - MarkAsReadDto: Đánh dấu thông báo đã đọc
 * - NotificationResponseDto: Định dạng phản hồi
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsUUID,
    IsEnum,
    IsNumber,
    Min,
    Max,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Loại thông báo
 */
export enum LoaiThongBao {
    // Liên quan công việc
    PHAN_CONG = 'PHAN_CONG',                         // Được phân công công việc
    CONG_VIEC_CAP_NHAT = 'CONG_VIEC_CAP_NHAT',       // Công việc được cập nhật

    // Liên quan báo giá
    BAO_GIA_DUOC_CHAP_NHAN = 'BAO_GIA_DUOC_CHAP_NHAN', // Báo giá được chấp nhận
    BAO_GIA_BI_TU_CHOI = 'BAO_GIA_BI_TU_CHOI',         // Báo giá bị từ chối

    // Liên quan khách hàng
    DANH_GIA_MOI = 'DANH_GIA_MOI',                   // Đánh giá mới

    // Hệ thống
    HE_THONG = 'HE_THONG',                           // Thông báo hệ thống
    KHAC = 'KHAC',                                   // Khác
}

/**
 * Loại đối tượng liên quan
 */
export enum LoaiDoiTuong {
    CONG_VIEC = 'CONG_VIEC',
    BAO_GIA = 'BAO_GIA',
    HOP_DONG = 'HOP_DONG',
    KHACH_HANG = 'KHACH_HANG',
    NGUOI_DUNG = 'NGUOI_DUNG',
}

// ============================================================
// CREATE NOTIFICATION DTO (Phương thức nội bộ Service)
// ============================================================

export class CreateNotificationDto {
    @ApiProperty({ description: 'ID người nhận (NguoiDung)', example: 'uuid-nguoi-nhan' })
    @IsUUID()
    id_nguoi_nhan: string;

    @ApiProperty({ description: 'Tiêu đề thông báo', example: 'Bạn được phân công vào công việc mới' })
    @IsString()
    tieu_de: string;

    @ApiPropertyOptional({ description: 'Nội dung thông báo', example: 'Công việc: Sửa máy lạnh tại...' })
    @IsOptional()
    @IsString()
    noi_dung?: string;

    @ApiPropertyOptional({ enum: LoaiThongBao, description: 'Loại thông báo' })
    @IsOptional()
    @IsEnum(LoaiThongBao)
    loai_thong_bao?: LoaiThongBao;

    @ApiPropertyOptional({ description: 'ID đối tượng liên quan (VD: ID công việc)', example: 'uuid-cong-viec' })
    @IsOptional()
    @IsUUID()
    id_doi_tuong_lien_quan?: string;

    @ApiPropertyOptional({ enum: LoaiDoiTuong, description: 'Loại đối tượng liên quan' })
    @IsOptional()
    @IsEnum(LoaiDoiTuong)
    loai_doi_tuong?: LoaiDoiTuong;
}

// ============================================================
// QUERY NOTIFICATION DTO
// ============================================================

export class QueryNotificationDto {
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

    @ApiPropertyOptional({ description: 'Lọc theo trạng thái đọc: true = đã đọc, false = chưa đọc' })
    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    da_xem?: boolean;

    @ApiPropertyOptional({ enum: LoaiThongBao, description: 'Lọc theo loại thông báo' })
    @IsOptional()
    @IsEnum(LoaiThongBao)
    loai_thong_bao?: LoaiThongBao;
}

// ============================================================
// MARK AS READ DTO
// ============================================================

export class MarkAsReadDto {
    @ApiProperty({ description: 'ID thông báo', example: 'uuid-thong-bao' })
    @IsUUID()
    notification_id: string;
}

// ============================================================
// NOTIFICATION RESPONSE DTO
// ============================================================

export class NotificationResponseDto {
    @ApiProperty({ example: 'uuid-thong-bao' })
    id: string;

    @ApiProperty({ example: 'uuid-nguoi-nhan' })
    id_nguoi_nhan: string;

    @ApiProperty({ example: 'Bạn được phân công vào công việc mới' })
    tieu_de: string;

    @ApiPropertyOptional({ example: 'Công việc: Sửa máy lạnh tại...' })
    noi_dung?: string;

    @ApiPropertyOptional({ enum: LoaiThongBao })
    loai_thong_bao?: string;

    @ApiPropertyOptional({ example: 'uuid-cong-viec' })
    id_doi_tuong_lien_quan?: string;

    @ApiPropertyOptional({ enum: LoaiDoiTuong })
    loai_doi_tuong?: string;

    @ApiProperty({ example: 0, description: '0 = chưa đọc, 1 = đã đọc' })
    da_xem: number;

    @ApiPropertyOptional({ example: '2026-01-07T08:00:00Z' })
    ngay_xem?: Date;

    @ApiProperty({ example: '2026-01-07T07:00:00Z' })
    ngay_tao: Date;
}

export class NotificationListResponseDto {
    @ApiProperty({ type: [NotificationResponseDto] })
    data: NotificationResponseDto[];

    @ApiProperty({
        example: {
            page: 1,
            limit: 20,
            total: 50,
            totalPages: 3,
            unread_count: 10,
        },
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        unread_count: number;
    };
}
