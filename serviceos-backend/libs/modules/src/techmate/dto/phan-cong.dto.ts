/**
 * ============================================================
 * PHÂN CÔNG DTOs - TechMate Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * DTOs cho quản lý phân công nhân sự bao gồm:
 * - AssignStaffDto: Phân công nhân viên vào công việc
 * - RemoveStaffDto: Gỡ nhân viên khỏi công việc
 * - PhanCongResponseDto: Response phân công
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    IsBoolean,
    IsInt,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// TRẠNG THÁI PHÂN CÔNG
// ============================================================

/**
 * Trạng thái phân công
 * - CHUA_NHAN (0): Chưa nhận việc
 * - DA_NHAN (1): Đã nhận việc
 * - DANG_LAM (2): Đang thực hiện
 * - HOAN_THANH (3): Hoàn thành phần việc
 */
export enum TrangThaiPhanCong {
    CHUA_NHAN = 0,
    DA_NHAN = 1,
    DANG_LAM = 2,
    HOAN_THANH = 3,
}

export const TrangThaiPhanCongLabels: Record<TrangThaiPhanCong, string> = {
    [TrangThaiPhanCong.CHUA_NHAN]: 'Chưa nhận việc',
    [TrangThaiPhanCong.DA_NHAN]: 'Đã nhận việc',
    [TrangThaiPhanCong.DANG_LAM]: 'Đang thực hiện',
    [TrangThaiPhanCong.HOAN_THANH]: 'Hoàn thành',
};

// ============================================================
// ASSIGN STAFF DTO
// ============================================================

export class AssignStaffDto {
    @ApiProperty({
        description: 'ID nhân viên được phân công (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID('4', { message: 'ID nhân viên không hợp lệ' })
    @IsNotEmpty({ message: 'ID nhân viên không được để trống' })
    id_nguoi_dung: string;

    @ApiPropertyOptional({
        description: 'Có phải trưởng nhóm không? (mặc định: false)',
        example: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    la_truong_nhom?: boolean = false;

    @ApiPropertyOptional({
        description: 'Ghi chú phân công',
        example: 'Phụ trách phần điện',
    })
    @IsOptional()
    @IsString()
    ghi_chu?: string;
}

// ============================================================
// BULK ASSIGN DTO (Phân công nhiều người)
// ============================================================

export class BulkAssignStaffDto {
    @ApiProperty({
        description: 'Danh sách phân công',
        type: [AssignStaffDto],
    })
    assignments: AssignStaffDto[];
}

// ============================================================
// UPDATE PHAN CONG DTO
// ============================================================

export class UpdatePhanCongDto {
    @ApiPropertyOptional({
        description: 'Cập nhật làm trưởng nhóm',
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    la_truong_nhom?: boolean;

    @ApiPropertyOptional({
        description: 'Trạng thái phân công',
        enum: TrangThaiPhanCong,
    })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    trang_thai?: TrangThaiPhanCong;

    @ApiPropertyOptional({
        description: 'Ghi chú',
    })
    @IsOptional()
    @IsString()
    ghi_chu?: string;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

export class PhanCongNguoiDungDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: 'Nguyễn Văn A' })
    ho_ten: string;

    @ApiPropertyOptional({ example: '0901234567' })
    so_dien_thoai?: string;

    @ApiPropertyOptional({ example: 'technician' })
    vai_tro?: string;
}

export class PhanCongCongViecDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: 'CV-1704585600000' })
    ma_cong_viec: string;

    @ApiProperty({ example: 'Sửa chữa điều hòa' })
    tieu_de: string;

    @ApiProperty({ example: 0 })
    trang_thai: number;

    @ApiPropertyOptional()
    ngay_hen?: Date;

    @ApiPropertyOptional()
    dia_chi_lam_viec?: string;
}

export class PhanCongResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id_cong_viec: string;

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id_nguoi_dung: string;

    @ApiProperty({ example: false })
    la_truong_nhom: boolean;

    @ApiProperty({ enum: TrangThaiPhanCong, example: 0 })
    trang_thai: TrangThaiPhanCong;

    @ApiPropertyOptional()
    ghi_chu?: string;

    @ApiProperty()
    ngay_tao: Date;

    @ApiPropertyOptional({ type: PhanCongNguoiDungDto })
    nguoi_dung?: PhanCongNguoiDungDto;

    @ApiPropertyOptional({ type: PhanCongCongViecDto })
    cong_viec?: PhanCongCongViecDto;
}

export class PhanCongListResponseDto {
    @ApiProperty({ type: [PhanCongResponseDto] })
    data: PhanCongResponseDto[];

    @ApiProperty({ example: 5 })
    total: number;
}
