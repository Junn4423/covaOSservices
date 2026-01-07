/**
 * ============================================================
 * DTOs - ShiftSquad Module (Cham Cong - Timekeeping)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Cham Cong DTOs for managing employee attendance:
 * - Check-in / Check-out
 * - Timesheet queries
 * - Daily reports
 * - Coordinate validation for GPS tracking
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    IsNumber,
    IsInt,
    Min,
    Max,
    IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Enum trạng thái chấm công
 */
export enum TrangThaiChamCong {
    CHUA_CHECKIN = 0,    // Chưa check-in
    DA_CHECKIN = 1,      // Đã check-in (đang làm việc)
    DA_CHECKOUT = 2,     // Đã check-out (hoàn thành ngày)
    VANG_MAT = 3,        // Vắng mặt
    TRE = 4,             // Trễ
    VE_SOM = 5,          // Về sớm
}

// ============================================================
// CHECK-IN DTO
// ============================================================

/**
 * DTO for employee check-in
 */
export class CheckInDto {
    @ApiPropertyOptional({
        description: 'Tọa độ vĩ độ để theo dõi GPS',
        example: 10.762622,
        minimum: -90,
        maximum: 90,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Tọa độ lat phải là số' })
    @Min(-90, { message: 'Tọa độ lat phải trong khoảng -90 đến 90' })
    @Max(90, { message: 'Tọa độ lat phải trong khoảng -90 đến 90' })
    @Type(() => Number)
    toa_do_lat?: number;

    @ApiPropertyOptional({
        description: 'Tọa độ kinh độ để theo dõi GPS',
        example: 106.660172,
        minimum: -180,
        maximum: 180,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Tọa độ lng phải là số' })
    @Min(-180, { message: 'Tọa độ lng phải trong khoảng -180 đến 180' })
    @Max(180, { message: 'Tọa độ lng phải trong khoảng -180 đến 180' })
    @Type(() => Number)
    toa_do_lng?: number;

    @ApiPropertyOptional({
        description: 'URL ảnh check-in (selfie)',
        example: 'https://storage.example.com/checkin/photo-001.jpg',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'URL ảnh checkin phải là chuỗi' })
    @MaxLength(500, { message: 'URL ảnh checkin tối đa 500 ký tự' })
    anh_checkin?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú cho check-in',
        example: 'Check-in tại văn phòng chính',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;
}

// ============================================================
// CHECK-OUT DTO
// ============================================================

/**
 * DTO for employee check-out
 */
export class CheckOutDto {
    @ApiPropertyOptional({
        description: 'Tọa độ vĩ độ để theo dõi GPS',
        example: 10.762622,
        minimum: -90,
        maximum: 90,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Tọa độ lat phải là số' })
    @Min(-90, { message: 'Tọa độ lat phải trong khoảng -90 đến 90' })
    @Max(90, { message: 'Tọa độ lat phải trong khoảng -90 đến 90' })
    @Type(() => Number)
    toa_do_lat?: number;

    @ApiPropertyOptional({
        description: 'Tọa độ kinh độ để theo dõi GPS',
        example: 106.660172,
        minimum: -180,
        maximum: 180,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Tọa độ lng phải là số' })
    @Min(-180, { message: 'Tọa độ lng phải trong khoảng -180 đến 180' })
    @Max(180, { message: 'Tọa độ lng phải trong khoảng -180 đến 180' })
    @Type(() => Number)
    toa_do_lng?: number;

    @ApiPropertyOptional({
        description: 'URL ảnh check-out',
        example: 'https://storage.example.com/checkout/photo-001.jpg',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'URL ảnh check-out phải là chuỗi' })
    @MaxLength(500, { message: 'URL ảnh check-out tối đa 500 ký tự' })
    anh_checkout?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú cho check-out',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;
}

// ============================================================
// TIMESHEET QUERY DTO
// ============================================================

/**
 * Query params for personal timesheet (getMyTimesheet)
 */
export class QueryTimesheetDto {
    @ApiProperty({
        description: 'Tháng (1-12)',
        example: 1,
        minimum: 1,
        maximum: 12,
    })
    @IsNotEmpty({ message: 'Tháng không được để trống' })
    @Type(() => Number)
    @IsInt({ message: 'Tháng phải là số nguyên' })
    @Min(1, { message: 'Tháng phải từ 1 đến 12' })
    @Max(12, { message: 'Tháng phải từ 1 đến 12' })
    thang: number;

    @ApiProperty({
        description: 'Năm',
        example: 2026,
        minimum: 2020,
        maximum: 2100,
    })
    @IsNotEmpty({ message: 'Năm không được để trống' })
    @Type(() => Number)
    @IsInt({ message: 'Năm phải là số nguyên' })
    @Min(2020, { message: 'Năm phải từ 2020 trở lên' })
    @Max(2100, { message: 'Năm không hợp lệ' })
    nam: number;
}

// ============================================================
// DAILY REPORT QUERY DTO
// ============================================================

/**
 * Query params for daily attendance report (Manager)
 */
export class QueryDailyReportDto {
    @ApiProperty({
        description: 'Ngày báo cáo (định dạng YYYY-MM-DD)',
        example: '2026-01-07',
    })
    @IsNotEmpty({ message: 'Ngày báo cáo không được để trống' })
    @IsDateString({}, { message: 'Ngày báo cáo phải theo định dạng YYYY-MM-DD' })
    ngay: string;

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
        description: 'Số mục mỗi trang',
        default: 50,
        minimum: 1,
        maximum: 200,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 50;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Embedded shift info in response
 */
export class CaLamViecEmbeddedDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Ca Sang' })
    ten_ca: string;

    @ApiProperty({ example: '08:00' })
    gio_bat_dau: string;

    @ApiProperty({ example: '17:00' })
    gio_ket_thuc: string;
}

/**
 * Embedded user info for attendance records
 */
export class ChamCongNguoiDungDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Nguyen Van A' })
    ho_ten: string;

    @ApiPropertyOptional({ example: 'nguyenvana@email.com' })
    email?: string;

    @ApiPropertyOptional({ example: 'Phòng Kỹ Thuật' })
    phong_ban?: string;
}

/**
 * Response DTO for attendance record
 */
export class ChamCongResponseDto {
    @ApiProperty({ description: 'ID bản ghi (UUID)' })
    id: string;

    @ApiProperty({ description: 'ID người dùng' })
    id_nguoi_dung: string;

    @ApiPropertyOptional({ description: 'ID ca làm việc' })
    id_ca_lam_viec?: string;

    @ApiProperty({ description: 'Ngày làm việc', example: '2026-01-07' })
    ngay_lam_viec: Date;

    @ApiPropertyOptional({ description: 'Thời gian check-in' })
    gio_checkin?: Date;

    @ApiPropertyOptional({ description: 'Thời gian check-out' })
    gio_checkout?: Date;

    @ApiPropertyOptional({ description: 'Vĩ độ check-in' })
    toa_do_checkin_lat?: number;

    @ApiPropertyOptional({ description: 'Kinh độ check-in' })
    toa_do_checkin_lng?: number;

    @ApiPropertyOptional({ description: 'Vĩ độ check-out' })
    toa_do_checkout_lat?: number;

    @ApiPropertyOptional({ description: 'Kinh độ check-out' })
    toa_do_checkout_lng?: number;

    @ApiPropertyOptional({ description: 'URL ảnh check-in' })
    anh_checkin?: string;

    @ApiPropertyOptional({ description: 'URL ảnh check-out' })
    anh_checkout?: string;

    @ApiProperty({ description: 'Trạng thái', example: 1 })
    trang_thai: number;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiPropertyOptional({ description: 'Số giờ làm việc (được tính toán)', example: 8.5 })
    so_gio_lam?: number;

    @ApiPropertyOptional({ description: 'Thông tin ca làm việc', type: CaLamViecEmbeddedDto })
    ca_lam_viec?: CaLamViecEmbeddedDto;

    @ApiPropertyOptional({ description: 'Thông tin người dùng', type: ChamCongNguoiDungDto })
    nguoi_dung?: ChamCongNguoiDungDto;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;
}

/**
 * Response for check-in confirmation
 */
export class CheckInResponseDto {
    @ApiProperty({ description: 'Thông báo thành công', example: 'Check-in thanh cong' })
    message: string;

    @ApiProperty({ description: 'Thời gian check-in' })
    gio_checkin: Date;

    @ApiPropertyOptional({ description: 'Ca làm việc áp dụng', type: CaLamViecEmbeddedDto })
    ca_lam_viec?: CaLamViecEmbeddedDto;

    @ApiProperty({ description: 'Bản ghi chấm công', type: ChamCongResponseDto })
    data: ChamCongResponseDto;
}

/**
 * Response for check-out confirmation
 */
export class CheckOutResponseDto {
    @ApiProperty({ description: 'Thông báo thành công', example: 'Check-out thanh cong' })
    message: string;

    @ApiProperty({ description: 'Thời gian check-out' })
    gio_checkout: Date;

    @ApiPropertyOptional({ description: 'Tổng số giờ làm việc', example: 8.5 })
    so_gio_lam?: number;

    @ApiProperty({ description: 'Bản ghi chấm công', type: ChamCongResponseDto })
    data: ChamCongResponseDto;
}

/**
 * Response for timesheet
 */
export class TimesheetResponseDto {
    @ApiProperty({ type: [ChamCongResponseDto] })
    data: ChamCongResponseDto[];

    @ApiProperty({
        description: 'Thống kê tổng hợp',
        example: {
            thang: 1,
            nam: 2026,
            tong_ngay_lam: 22,
            tong_gio_lam: 176,
            so_ngay_di_tre: 2,
            so_ngay_vang: 1,
        },
    })
    summary: {
        thang: number;
        nam: number;
        tong_ngay_lam: number;
        tong_gio_lam: number;
        so_ngay_di_tre: number;
        so_ngay_vang: number;
    };
}

/**
 * Employee status in daily report
 */
export class EmployeeDailyStatusDto {
    @ApiProperty({ description: 'Thông tin người dùng', type: ChamCongNguoiDungDto })
    nguoi_dung: ChamCongNguoiDungDto;

    @ApiProperty({
        description: 'Trạng thái chấm công',
        enum: ['PRESENT', 'ABSENT', 'LATE', 'EARLY_LEAVE', 'NOT_CHECKED_IN'],
        example: 'PRESENT',
    })
    trang_thai_text: string;

    @ApiPropertyOptional({ description: 'Thời gian check-in' })
    gio_checkin?: Date;

    @ApiPropertyOptional({ description: 'Thời gian check-out' })
    gio_checkout?: Date;

    @ApiPropertyOptional({ description: 'Số giờ làm việc', example: 8.5 })
    so_gio_lam?: number;

    @ApiPropertyOptional({ description: 'Thông tin ca làm việc', type: CaLamViecEmbeddedDto })
    ca_lam_viec?: CaLamViecEmbeddedDto;
}

/**
 * Response for daily attendance report
 */
export class DailyReportResponseDto {
    @ApiProperty({ type: [EmployeeDailyStatusDto] })
    data: EmployeeDailyStatusDto[];

    @ApiProperty({
        description: 'Tổng hợp hàng ngày',
        example: {
            ngay: '2026-01-07',
            tong_nhan_vien: 20,
            co_mat: 18,
            vang_mat: 2,
            di_tre: 3,
        },
    })
    summary: {
        ngay: string;
        tong_nhan_vien: number;
        co_mat: number;
        vang_mat: number;
        di_tre: number;
    };

    @ApiProperty({
        description: 'Thông tin phân trang',
        example: { page: 1, limit: 50, total: 20, totalPages: 1 },
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Tính số giờ làm việc giữa check-in và check-out
 * Trả về số giờ dưới dạng thập phân (ví dụ: 8.5 cho 8 giờ 30 phút)
 */
export function calculateWorkingHours(checkin: Date, checkout: Date): number {
    const diffMs = checkout.getTime() - checkin.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
}

/**
 * Ánh xạ trạng thái số sang văn bản
 */
export function mapStatusToText(status: TrangThaiChamCong): string {
    const statusMap: Record<TrangThaiChamCong, string> = {
        [TrangThaiChamCong.CHUA_CHECKIN]: 'NOT_CHECKED_IN',
        [TrangThaiChamCong.DA_CHECKIN]: 'PRESENT',
        [TrangThaiChamCong.DA_CHECKOUT]: 'PRESENT',
        [TrangThaiChamCong.VANG_MAT]: 'ABSENT',
        [TrangThaiChamCong.TRE]: 'LATE',
        [TrangThaiChamCong.VE_SOM]: 'EARLY_LEAVE',
    };
    return statusMap[status] || 'UNKNOWN';
}
