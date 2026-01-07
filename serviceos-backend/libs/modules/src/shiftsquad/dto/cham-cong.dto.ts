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
 * Attendance status enum
 */
export enum TrangThaiChamCong {
    CHUA_CHECKIN = 0,    // Not checked in yet
    DA_CHECKIN = 1,      // Checked in (working)
    DA_CHECKOUT = 2,     // Checked out (completed day)
    VANG_MAT = 3,        // Absent
    TRE = 4,             // Late
    VE_SOM = 5,          // Left early
}

// ============================================================
// CHECK-IN DTO
// ============================================================

/**
 * DTO for employee check-in
 */
export class CheckInDto {
    @ApiPropertyOptional({
        description: 'Latitude coordinate for GPS tracking',
        example: 10.762622,
        minimum: -90,
        maximum: 90,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Toa do lat phai la so' })
    @Min(-90, { message: 'Latitude phai trong khoang -90 den 90' })
    @Max(90, { message: 'Latitude phai trong khoang -90 den 90' })
    @Type(() => Number)
    toa_do_lat?: number;

    @ApiPropertyOptional({
        description: 'Longitude coordinate for GPS tracking',
        example: 106.660172,
        minimum: -180,
        maximum: 180,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Toa do lng phai la so' })
    @Min(-180, { message: 'Longitude phai trong khoang -180 den 180' })
    @Max(180, { message: 'Longitude phai trong khoang -180 den 180' })
    @Type(() => Number)
    toa_do_lng?: number;

    @ApiPropertyOptional({
        description: 'URL of check-in photo (selfie)',
        example: 'https://storage.example.com/checkin/photo-001.jpg',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'URL anh checkin phai la chuoi' })
    @MaxLength(500, { message: 'URL anh checkin toi da 500 ky tu' })
    anh_checkin?: string;

    @ApiPropertyOptional({
        description: 'Notes for check-in',
        example: 'Check-in tai van phong chinh',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chu phai la chuoi' })
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
        description: 'Latitude coordinate for GPS tracking',
        example: 10.762622,
        minimum: -90,
        maximum: 90,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Toa do lat phai la so' })
    @Min(-90, { message: 'Latitude phai trong khoang -90 den 90' })
    @Max(90, { message: 'Latitude phai trong khoang -90 den 90' })
    @Type(() => Number)
    toa_do_lat?: number;

    @ApiPropertyOptional({
        description: 'Longitude coordinate for GPS tracking',
        example: 106.660172,
        minimum: -180,
        maximum: 180,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Toa do lng phai la so' })
    @Min(-180, { message: 'Longitude phai trong khoang -180 den 180' })
    @Max(180, { message: 'Longitude phai trong khoang -180 den 180' })
    @Type(() => Number)
    toa_do_lng?: number;

    @ApiPropertyOptional({
        description: 'URL of check-out photo',
        example: 'https://storage.example.com/checkout/photo-001.jpg',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'URL anh checkout phai la chuoi' })
    @MaxLength(500, { message: 'URL anh checkout toi da 500 ky tu' })
    anh_checkout?: string;

    @ApiPropertyOptional({
        description: 'Notes for check-out',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chu phai la chuoi' })
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
        description: 'Month (1-12)',
        example: 1,
        minimum: 1,
        maximum: 12,
    })
    @IsNotEmpty({ message: 'Thang khong duoc de trong' })
    @Type(() => Number)
    @IsInt({ message: 'Thang phai la so nguyen' })
    @Min(1, { message: 'Thang phai tu 1 den 12' })
    @Max(12, { message: 'Thang phai tu 1 den 12' })
    thang: number;

    @ApiProperty({
        description: 'Year',
        example: 2026,
        minimum: 2020,
        maximum: 2100,
    })
    @IsNotEmpty({ message: 'Nam khong duoc de trong' })
    @Type(() => Number)
    @IsInt({ message: 'Nam phai la so nguyen' })
    @Min(2020, { message: 'Nam phai tu 2020 tro len' })
    @Max(2100, { message: 'Nam khong hop le' })
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
        description: 'Date to report (YYYY-MM-DD)',
        example: '2026-01-07',
    })
    @IsNotEmpty({ message: 'Ngay bao cao khong duoc de trong' })
    @IsDateString({}, { message: 'Ngay bao cao phai theo dinh dang YYYY-MM-DD' })
    ngay: string;

    @ApiPropertyOptional({
        description: 'Page number',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Items per page',
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

    @ApiPropertyOptional({ example: 'Phong Ky Thuat' })
    phong_ban?: string;
}

/**
 * Response DTO for attendance record
 */
export class ChamCongResponseDto {
    @ApiProperty({ description: 'Record ID (UUID)' })
    id: string;

    @ApiProperty({ description: 'User ID' })
    id_nguoi_dung: string;

    @ApiPropertyOptional({ description: 'Shift ID' })
    id_ca_lam_viec?: string;

    @ApiProperty({ description: 'Work date', example: '2026-01-07' })
    ngay_lam_viec: Date;

    @ApiPropertyOptional({ description: 'Check-in time' })
    gio_checkin?: Date;

    @ApiPropertyOptional({ description: 'Check-out time' })
    gio_checkout?: Date;

    @ApiPropertyOptional({ description: 'Check-in latitude' })
    toa_do_checkin_lat?: number;

    @ApiPropertyOptional({ description: 'Check-in longitude' })
    toa_do_checkin_lng?: number;

    @ApiPropertyOptional({ description: 'Check-out latitude' })
    toa_do_checkout_lat?: number;

    @ApiPropertyOptional({ description: 'Check-out longitude' })
    toa_do_checkout_lng?: number;

    @ApiPropertyOptional({ description: 'Check-in photo URL' })
    anh_checkin?: string;

    @ApiPropertyOptional({ description: 'Check-out photo URL' })
    anh_checkout?: string;

    @ApiProperty({ description: 'Status', example: 1 })
    trang_thai: number;

    @ApiPropertyOptional({ description: 'Notes' })
    ghi_chu?: string;

    @ApiPropertyOptional({ description: 'Working hours (calculated)', example: 8.5 })
    so_gio_lam?: number;

    @ApiPropertyOptional({ description: 'Shift info', type: CaLamViecEmbeddedDto })
    ca_lam_viec?: CaLamViecEmbeddedDto;

    @ApiPropertyOptional({ description: 'User info', type: ChamCongNguoiDungDto })
    nguoi_dung?: ChamCongNguoiDungDto;

    @ApiProperty({ description: 'Created date' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Updated date' })
    ngay_cap_nhat: Date;
}

/**
 * Response for check-in confirmation
 */
export class CheckInResponseDto {
    @ApiProperty({ description: 'Success message', example: 'Check-in thanh cong' })
    message: string;

    @ApiProperty({ description: 'Check-in time' })
    gio_checkin: Date;

    @ApiPropertyOptional({ description: 'Shift applied', type: CaLamViecEmbeddedDto })
    ca_lam_viec?: CaLamViecEmbeddedDto;

    @ApiProperty({ description: 'Attendance record', type: ChamCongResponseDto })
    data: ChamCongResponseDto;
}

/**
 * Response for check-out confirmation
 */
export class CheckOutResponseDto {
    @ApiProperty({ description: 'Success message', example: 'Check-out thanh cong' })
    message: string;

    @ApiProperty({ description: 'Check-out time' })
    gio_checkout: Date;

    @ApiPropertyOptional({ description: 'Total working hours', example: 8.5 })
    so_gio_lam?: number;

    @ApiProperty({ description: 'Attendance record', type: ChamCongResponseDto })
    data: ChamCongResponseDto;
}

/**
 * Response for timesheet
 */
export class TimesheetResponseDto {
    @ApiProperty({ type: [ChamCongResponseDto] })
    data: ChamCongResponseDto[];

    @ApiProperty({
        description: 'Summary statistics',
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
    @ApiProperty({ description: 'User info', type: ChamCongNguoiDungDto })
    nguoi_dung: ChamCongNguoiDungDto;

    @ApiProperty({
        description: 'Attendance status',
        enum: ['PRESENT', 'ABSENT', 'LATE', 'EARLY_LEAVE', 'NOT_CHECKED_IN'],
        example: 'PRESENT',
    })
    trang_thai_text: string;

    @ApiPropertyOptional({ description: 'Check-in time' })
    gio_checkin?: Date;

    @ApiPropertyOptional({ description: 'Check-out time' })
    gio_checkout?: Date;

    @ApiPropertyOptional({ description: 'Working hours', example: 8.5 })
    so_gio_lam?: number;

    @ApiPropertyOptional({ description: 'Shift info', type: CaLamViecEmbeddedDto })
    ca_lam_viec?: CaLamViecEmbeddedDto;
}

/**
 * Response for daily attendance report
 */
export class DailyReportResponseDto {
    @ApiProperty({ type: [EmployeeDailyStatusDto] })
    data: EmployeeDailyStatusDto[];

    @ApiProperty({
        description: 'Daily summary',
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
        description: 'Pagination info',
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
 * Calculate working hours between check-in and check-out
 * Returns hours as decimal (e.g., 8.5 for 8 hours 30 minutes)
 */
export function calculateWorkingHours(checkin: Date, checkout: Date): number {
    const diffMs = checkout.getTime() - checkin.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
}

/**
 * Map numeric status to text
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
