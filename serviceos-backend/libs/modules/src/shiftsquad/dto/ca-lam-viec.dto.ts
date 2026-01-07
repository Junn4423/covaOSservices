/**
 * ============================================================
 * DTOs - ShiftSquad Module (Ca Lam Viec - Shift Management)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Ca Lam Viec DTOs for managing work shifts:
 * - Create, Update, Query shifts
 * - Time format validation (HH:mm)
 * - Days of week validation
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    Matches,
    IsInt,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Regex pattern for time format HH:mm (24-hour format)
 * Examples: 08:00, 17:30, 23:59
 */
const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Regex pattern for days of week (comma-separated numbers 2-8)
 * 2=Monday, 3=Tuesday, ..., 8=Sunday
 * Examples: "2,3,4,5,6" (Mon-Fri), "2,3,4,5,6,7,8" (All week)
 */
const DAYS_OF_WEEK_REGEX = /^[2-8](,[2-8])*$/;

// ============================================================
// CREATE DTO
// ============================================================

/**
 * DTO to create a new shift (Ca Lam Viec)
 */
export class CreateCaLamViecDto {
    @ApiProperty({
        description: 'Shift name',
        example: 'Ca Sang',
        maxLength: 100,
    })
    @IsNotEmpty({ message: 'Ten ca khong duoc de trong' })
    @IsString({ message: 'Ten ca phai la chuoi' })
    @MaxLength(100, { message: 'Ten ca toi da 100 ky tu' })
    @Transform(({ value }) => value?.trim())
    ten_ca: string;

    @ApiProperty({
        description: 'Start time (HH:mm format, 24-hour)',
        example: '08:00',
    })
    @IsNotEmpty({ message: 'Gio bat dau khong duoc de trong' })
    @IsString({ message: 'Gio bat dau phai la chuoi' })
    @Matches(TIME_FORMAT_REGEX, {
        message: 'Gio bat dau phai theo dinh dang HH:mm (VD: 08:00, 17:30)',
    })
    gio_bat_dau: string;

    @ApiProperty({
        description: 'End time (HH:mm format, 24-hour)',
        example: '17:00',
    })
    @IsNotEmpty({ message: 'Gio ket thuc khong duoc de trong' })
    @IsString({ message: 'Gio ket thuc phai la chuoi' })
    @Matches(TIME_FORMAT_REGEX, {
        message: 'Gio ket thuc phai theo dinh dang HH:mm (VD: 08:00, 17:30)',
    })
    gio_ket_thuc: string;

    @ApiPropertyOptional({
        description: 'Days of week to apply (comma-separated: 2=Mon, 3=Tue, ..., 8=Sun)',
        example: '2,3,4,5,6',
        default: '2,3,4,5,6',
    })
    @IsOptional()
    @IsString({ message: 'Ap dung thu phai la chuoi' })
    @Matches(DAYS_OF_WEEK_REGEX, {
        message: 'Ap dung thu phai la danh sach cac so tu 2-8 cach nhau boi dau phay (VD: 2,3,4,5,6)',
    })
    ap_dung_thu?: string = '2,3,4,5,6';
}

// ============================================================
// UPDATE DTO
// ============================================================

/**
 * DTO to update a shift
 */
export class UpdateCaLamViecDto {
    @ApiPropertyOptional({
        description: 'Shift name',
        example: 'Ca Sang - Updated',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Ten ca phai la chuoi' })
    @MaxLength(100, { message: 'Ten ca toi da 100 ky tu' })
    @Transform(({ value }) => value?.trim())
    ten_ca?: string;

    @ApiPropertyOptional({
        description: 'Start time (HH:mm format, 24-hour)',
        example: '07:30',
    })
    @IsOptional()
    @IsString({ message: 'Gio bat dau phai la chuoi' })
    @Matches(TIME_FORMAT_REGEX, {
        message: 'Gio bat dau phai theo dinh dang HH:mm (VD: 08:00, 17:30)',
    })
    gio_bat_dau?: string;

    @ApiPropertyOptional({
        description: 'End time (HH:mm format, 24-hour)',
        example: '17:30',
    })
    @IsOptional()
    @IsString({ message: 'Gio ket thuc phai la chuoi' })
    @Matches(TIME_FORMAT_REGEX, {
        message: 'Gio ket thuc phai theo dinh dang HH:mm (VD: 08:00, 17:30)',
    })
    gio_ket_thuc?: string;

    @ApiPropertyOptional({
        description: 'Days of week to apply (comma-separated: 2=Mon, 3=Tue, ..., 8=Sun)',
        example: '2,3,4,5,6,7',
    })
    @IsOptional()
    @IsString({ message: 'Ap dung thu phai la chuoi' })
    @Matches(DAYS_OF_WEEK_REGEX, {
        message: 'Ap dung thu phai la danh sach cac so tu 2-8 cach nhau boi dau phay (VD: 2,3,4,5,6)',
    })
    ap_dung_thu?: string;

    @ApiPropertyOptional({
        description: 'Status (1=Active, 0=Inactive)',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Trang thai phai la so nguyen' })
    trang_thai?: number;
}

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Query params for shift list
 */
export class QueryCaLamViecDto {
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
        description: 'Filter by status (1=Active, 0=Inactive)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    trang_thai?: number;

    @ApiPropertyOptional({
        description: 'Search by name',
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
 * Response DTO for a shift
 */
export class CaLamViecResponseDto {
    @ApiProperty({ description: 'Shift ID (UUID)' })
    id: string;

    @ApiProperty({ description: 'Shift name', example: 'Ca Sang' })
    ten_ca: string;

    @ApiProperty({ description: 'Start time', example: '08:00:00' })
    gio_bat_dau: Date;

    @ApiProperty({ description: 'End time', example: '17:00:00' })
    gio_ket_thuc: Date;

    @ApiProperty({ description: 'Days of week applied', example: '2,3,4,5,6' })
    ap_dung_thu: string;

    @ApiProperty({ description: 'Status (1=Active, 0=Inactive)', example: 1 })
    trang_thai: number;

    @ApiProperty({ description: 'Created date' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Updated date' })
    ngay_cap_nhat: Date;
}

/**
 * Response for paginated shift list
 */
export class CaLamViecListResponseDto {
    @ApiProperty({ type: [CaLamViecResponseDto] })
    data: CaLamViecResponseDto[];

    @ApiProperty({
        description: 'Pagination info',
        example: { page: 1, limit: 20, total: 5, totalPages: 1 },
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
 * Parse time string HH:mm to Date object (today's date with specified time)
 * Used for storing in MySQL TIME field
 */
export function parseTimeString(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * Format Date to HH:mm string
 */
export function formatTimeToString(date: Date): string {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Parse days of week string to array of numbers
 */
export function parseDaysOfWeek(daysStr: string): number[] {
    return daysStr.split(',').map(Number);
}
