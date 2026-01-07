/**
 * ============================================================
 * CÔNG VIỆC DTOs - TechMate Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * DTOs cho quản lý công việc (Jobs) bao gồm:
 * - Enums: TrangThaiCongViec, DoUuTien
 * - CreateCongViecDto: Tạo công việc mới
 * - UpdateCongViecDto: Cập nhật công việc
 * - QueryCongViecDto: Filter & pagination
 * - UpdateStatusDto: Chuyển trạng thái
 */

import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsUUID,
    IsInt,
    IsEnum,
    IsNumber,
    IsDateString,
    Min,
    Max,
    MaxLength,
    ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Trạng thái công việc
 * - MOI_TAO (0): Mới tạo, chờ phân công
 * - DANG_THUC_HIEN (1): Đang thực hiện
 * - HOAN_THANH (2): Hoàn thành
 * - HUY (3): Đã hủy
 */
export enum TrangThaiCongViec {
    MOI_TAO = 0,
    DANG_THUC_HIEN = 1,
    HOAN_THANH = 2,
    HUY = 3,
}

/**
 * Mô tả trạng thái công việc (cho Swagger)
 */
export const TrangThaiCongViecLabels: Record<TrangThaiCongViec, string> = {
    [TrangThaiCongViec.MOI_TAO]: 'Mới tạo',
    [TrangThaiCongViec.DANG_THUC_HIEN]: 'Đang thực hiện',
    [TrangThaiCongViec.HOAN_THANH]: 'Hoàn thành',
    [TrangThaiCongViec.HUY]: 'Đã hủy',
};

/**
 * Độ ưu tiên công việc
 * - THAP (1): Thấp
 * - TRUNG_BINH (2): Trung bình (mặc định)
 * - CAO (3): Cao
 * - KHAN_CAP (4): Khẩn cấp
 */
export enum DoUuTien {
    THAP = 1,
    TRUNG_BINH = 2,
    CAO = 3,
    KHAN_CAP = 4,
}

export const DoUuTienLabels: Record<DoUuTien, string> = {
    [DoUuTien.THAP]: 'Thấp',
    [DoUuTien.TRUNG_BINH]: 'Trung bình',
    [DoUuTien.CAO]: 'Cao',
    [DoUuTien.KHAN_CAP]: 'Khẩn cấp',
};

// ============================================================
// CREATE DTO
// ============================================================

export class CreateCongViecDto {
    @ApiProperty({
        description: 'Tiêu đề công việc',
        example: 'Sửa chữa điều hòa tại nhà khách',
        maxLength: 255,
    })
    @IsString()
    @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
    @MaxLength(255)
    tieu_de: string;

    @ApiPropertyOptional({
        description: 'Mô tả chi tiết công việc',
        example: 'Điều hòa Daikin 2HP bị rò gas, cần kiểm tra và nạp gas mới',
    })
    @IsOptional()
    @IsString()
    mo_ta?: string;

    @ApiPropertyOptional({
        description: 'ID khách hàng (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID khách hàng không hợp lệ' })
    id_khach_hang?: string;

    @ApiPropertyOptional({
        description: 'Ngày hẹn thực hiện công việc (ISO 8601). Phải >= ngày hiện tại.',
        example: '2026-01-10T09:00:00.000Z',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày hẹn không đúng định dạng ISO 8601' })
    ngay_hen?: string;

    @ApiPropertyOptional({
        description: 'Địa chỉ làm việc',
        example: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    dia_chi_lam_viec?: string;

    @ApiPropertyOptional({
        description: 'Tọa độ vĩ độ (Latitude)',
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
        description: 'Tọa độ kinh độ (Longitude)',
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

    @ApiPropertyOptional({
        description: 'Độ ưu tiên (1-4). Mặc định: 2 (Trung bình)',
        example: 2,
        enum: DoUuTien,
        default: DoUuTien.TRUNG_BINH,
    })
    @IsOptional()
    @IsInt()
    @IsEnum(DoUuTien, { message: 'Độ ưu tiên phải từ 1-4' })
    @Type(() => Number)
    do_uu_tien?: DoUuTien;

    @ApiPropertyOptional({
        description: 'Thời gian dự kiến thực hiện (phút)',
        example: 60,
        minimum: 1,
    })
    @IsOptional()
    @IsInt()
    @Min(1, { message: 'Thời gian dự kiến phải >= 1 phút' })
    @Type(() => Number)
    thoi_gian_du_kien?: number;

    @ApiPropertyOptional({
        description: 'Ghi chú nội bộ (chỉ nhân viên xem)',
        example: 'Khách hàng VIP, cần ưu tiên',
    })
    @IsOptional()
    @IsString()
    ghi_chu_noi_bo?: string;
}

// ============================================================
// UPDATE DTO
// ============================================================

export class UpdateCongViecDto extends PartialType(CreateCongViecDto) { }

// ============================================================
// UPDATE STATUS DTO
// ============================================================

export class UpdateStatusDto {
    @ApiProperty({
        description: 'Trạng thái mới của công việc',
        enum: TrangThaiCongViec,
        example: 1,
    })
    @IsInt()
    @IsEnum(TrangThaiCongViec, {
        message: 'Trạng thái phải là: 0 (Mới tạo), 1 (Đang thực hiện), 2 (Hoàn thành), 3 (Hủy)',
    })
    @Type(() => Number)
    trang_thai: TrangThaiCongViec;

    @ApiPropertyOptional({
        description: 'Ghi chú khi chuyển trạng thái',
        example: 'Đã hoàn thành sửa chữa, khách hàng hài lòng',
    })
    @IsOptional()
    @IsString()
    ghi_chu?: string;
}

// ============================================================
// QUERY DTO (Filter & Pagination)
// ============================================================

export class QueryCongViecDto {
    @ApiPropertyOptional({
        description: 'Số trang (bắt đầu từ 1)',
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
        example: 20,
        default: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái',
        enum: TrangThaiCongViec,
        example: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(TrangThaiCongViec)
    trang_thai?: TrangThaiCongViec;

    @ApiPropertyOptional({
        description: 'Lọc theo khách hàng (UUID)',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsUUID('4')
    id_khach_hang?: string;

    @ApiPropertyOptional({
        description: 'Từ ngày hẹn (ISO 8601)',
        example: '2026-01-01T00:00:00.000Z',
    })
    @IsOptional()
    @IsDateString()
    tu_ngay?: string;

    @ApiPropertyOptional({
        description: 'Đến ngày hẹn (ISO 8601)',
        example: '2026-01-31T23:59:59.999Z',
    })
    @IsOptional()
    @IsDateString()
    den_ngay?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo độ ưu tiên',
        enum: DoUuTien,
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(DoUuTien)
    do_uu_tien?: DoUuTien;

    @ApiPropertyOptional({
        description: 'Tìm kiếm theo tiêu đề hoặc mã công việc',
        example: 'sửa điều hòa',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Bao gồm bản ghi đã xóa mềm',
        default: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    include_deleted?: boolean = false;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

export class CongViecKhachHangDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: 'Nguyễn Văn A' })
    ho_ten: string;

    @ApiPropertyOptional({ example: '0901234567' })
    so_dien_thoai?: string;

    @ApiPropertyOptional({ example: '123 Đường ABC' })
    dia_chi?: string;
}

export class CongViecPhanCongDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: false })
    la_truong_nhom: boolean;

    @ApiProperty()
    nguoi_dung: {
        id: string;
        ho_ten: string;
        so_dien_thoai?: string;
    };
}

export class CongViecResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ example: 'CV-1704585600000' })
    ma_cong_viec: string;

    @ApiProperty({ example: 'Sửa chữa điều hòa' })
    tieu_de: string;

    @ApiPropertyOptional()
    mo_ta?: string;

    @ApiProperty({ enum: TrangThaiCongViec, example: 0 })
    trang_thai: TrangThaiCongViec;

    @ApiProperty({ enum: DoUuTien, example: 2 })
    do_uu_tien: DoUuTien;

    @ApiPropertyOptional()
    ngay_hen?: Date;

    @ApiPropertyOptional()
    ngay_hoan_thanh?: Date;

    @ApiPropertyOptional()
    dia_chi_lam_viec?: string;

    @ApiPropertyOptional()
    toa_do_lat?: number;

    @ApiPropertyOptional()
    toa_do_lng?: number;

    @ApiPropertyOptional()
    thoi_gian_du_kien?: number;

    @ApiPropertyOptional()
    ghi_chu_noi_bo?: string;

    @ApiProperty()
    ngay_tao: Date;

    @ApiProperty()
    ngay_cap_nhat: Date;

    @ApiPropertyOptional({ type: CongViecKhachHangDto })
    khach_hang?: CongViecKhachHangDto;

    @ApiPropertyOptional({ type: [CongViecPhanCongDto] })
    phan_cong?: CongViecPhanCongDto[];
}

export class CongViecListResponseDto {
    @ApiProperty({ type: [CongViecResponseDto] })
    data: CongViecResponseDto[];

    @ApiProperty({
        example: {
            page: 1,
            limit: 20,
            total: 100,
            totalPages: 5,
        },
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
