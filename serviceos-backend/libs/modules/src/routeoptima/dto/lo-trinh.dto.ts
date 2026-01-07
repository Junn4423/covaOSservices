/**
 * ============================================================
 * DTOs - RouteOptima Module (Lo Trinh - Route Management)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Route Management DTOs:
 * - Create routes with stops
 * - Query routes
 * - Route status handling
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsUUID,
    IsNumber,
    Min,
    Max,
    IsInt,
    IsDateString,
    IsArray,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS
// ============================================================

/**
 * Route status enum
 */
export enum TrangThaiLoTrinh {
    PENDING = 0,      // Not started
    IN_PROGRESS = 1,  // In progress
    COMPLETED = 2,    // All stops visited
    CANCELLED = 3,    // Cancelled
}

/**
 * Stop status enum
 */
export enum TrangThaiDiemDung {
    PENDING = 0,   // Not visited
    VISITED = 1,   // Visited/Completed
    SKIPPED = 2,   // Skipped
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Convert Prisma Decimal to number for route distance/coordinates
 */
function decimalToNumber(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

// ============================================================
// STOP INPUT DTO (for creating routes)
// ============================================================

/**
 * Stop item when creating a route
 */
export class CreateDiemDungItemDto {
    @ApiProperty({
        description: 'Stop order (1, 2, 3...)',
        example: 1,
        minimum: 1,
    })
    @IsNotEmpty({ message: 'Thu tu diem dung khong duoc de trong' })
    @Type(() => Number)
    @IsInt({ message: 'Thu tu phai la so nguyen' })
    @Min(1, { message: 'Thu tu phai >= 1' })
    thu_tu: number;

    @ApiPropertyOptional({
        description: 'Stop address',
        example: '123 Nguyen Hue, Q1, HCM',
    })
    @IsOptional()
    @IsString({ message: 'Dia chi phai la chuoi' })
    @Transform(({ value }) => value?.trim())
    dia_chi?: string;

    @ApiPropertyOptional({
        description: 'Latitude',
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
        description: 'Longitude',
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
        description: 'Expected arrival time (ISO DateTime)',
        example: '2026-01-07T09:00:00',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Thoi gian den du kien phai la dinh dang ISO' })
    thoi_gian_den_du_kien?: string;

    @ApiPropertyOptional({
        description: 'Related job ID',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID cong viec phai la UUID hop le' })
    cong_viec_id?: string;

    @ApiPropertyOptional({
        description: 'Notes for this stop',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chu phai la chuoi' })
    ghi_chu?: string;
}

// ============================================================
// CREATE ROUTE DTO
// ============================================================

/**
 * DTO to create a new route with stops
 */
export class CreateLoTrinhDto {
    @ApiProperty({
        description: 'Route date (YYYY-MM-DD)',
        example: '2026-01-07',
    })
    @IsNotEmpty({ message: 'Ngay lo trinh khong duoc de trong' })
    @IsDateString({}, { message: 'Ngay lo trinh phai theo dinh dang YYYY-MM-DD' })
    ngay_lo_trinh: string;

    @ApiProperty({
        description: 'Staff/Driver user ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID nguoi dung khong duoc de trong' })
    @IsUUID('4', { message: 'ID nguoi dung phai la UUID hop le' })
    nguoi_dung_id: string;

    @ApiProperty({
        description: 'List of stops (must have at least 1)',
        type: [CreateDiemDungItemDto],
    })
    @IsNotEmpty({ message: 'Danh sach diem dung khong duoc de trong' })
    @IsArray({ message: 'Stops phai la mang' })
    @ArrayMinSize(1, { message: 'Phai co it nhat 1 diem dung' })
    @ValidateNested({ each: true })
    @Type(() => CreateDiemDungItemDto)
    stops: CreateDiemDungItemDto[];

    @ApiPropertyOptional({
        description: 'Notes for the route',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chu phai la chuoi' })
    ghi_chu?: string;
}

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Query params for route list
 */
export class QueryLoTrinhDto {
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
        description: 'Filter by date (YYYY-MM-DD)',
        example: '2026-01-07',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay phai theo dinh dang YYYY-MM-DD' })
    ngay?: string;

    @ApiPropertyOptional({
        description: 'Filter by staff user ID',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID nguoi dung phai la UUID hop le' })
    nguoi_dung_id?: string;

    @ApiPropertyOptional({
        description: 'Filter by status (0=Pending, 1=InProgress, 2=Completed, 3=Cancelled)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    trang_thai?: number;
}

/**
 * Query params for getMyRoute
 */
export class QueryMyRouteDto {
    @ApiPropertyOptional({
        description: 'Date (YYYY-MM-DD). Defaults to today.',
        example: '2026-01-07',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay phai theo dinh dang YYYY-MM-DD' })
    ngay?: string;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Embedded user info
 */
export class NguoiDungRouteDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Nguyen Van A' })
    ho_ten: string;

    @ApiPropertyOptional({ example: 'nguyenvana@email.com' })
    email?: string;

    @ApiPropertyOptional({ example: '0901234567' })
    so_dien_thoai?: string;
}

/**
 * Embedded job info
 */
export class CongViecRouteDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiPropertyOptional({ example: 'CV-001' })
    ma_cong_viec?: string;

    @ApiProperty({ example: 'Bao tri may lanh' })
    tieu_de: string;
}

/**
 * Response DTO for a stop
 */
export class DiemDungResponseDto {
    @ApiProperty({ description: 'Stop ID (UUID)' })
    id: string;

    @ApiProperty({ description: 'Stop order', example: 1 })
    thu_tu: number;

    @ApiPropertyOptional({ description: 'Address' })
    dia_chi?: string;

    @ApiPropertyOptional({ description: 'Latitude' })
    toa_do_lat?: number;

    @ApiPropertyOptional({ description: 'Longitude' })
    toa_do_lng?: number;

    @ApiPropertyOptional({ description: 'Expected arrival time' })
    thoi_gian_den_du_kien?: Date;

    @ApiPropertyOptional({ description: 'Actual arrival time' })
    thoi_gian_den_thuc_te?: Date;

    @ApiPropertyOptional({ description: 'Departure time' })
    thoi_gian_roi_di?: Date;

    @ApiProperty({ description: 'Status (0=Pending, 1=Visited, 2=Skipped)', example: 0 })
    trang_thai: number;

    @ApiPropertyOptional({ description: 'Notes' })
    ghi_chu?: string;

    @ApiPropertyOptional({ description: 'Related job info', type: CongViecRouteDto })
    cong_viec?: CongViecRouteDto;
}

/**
 * Response DTO for a route
 */
export class LoTrinhResponseDto {
    @ApiProperty({ description: 'Route ID (UUID)' })
    id: string;

    @ApiProperty({ description: 'Route date' })
    ngay_lo_trinh: Date;

    @ApiProperty({ description: 'Status (0=Pending, 1=InProgress, 2=Completed, 3=Cancelled)', example: 0 })
    trang_thai: number;

    @ApiPropertyOptional({ description: 'Total distance (km)' })
    tong_khoang_cach?: number;

    @ApiPropertyOptional({ description: 'Start time' })
    thoi_gian_bat_dau?: Date;

    @ApiPropertyOptional({ description: 'End time' })
    thoi_gian_ket_thuc?: Date;

    @ApiPropertyOptional({ description: 'Notes' })
    ghi_chu?: string;

    @ApiProperty({ description: 'Staff info', type: NguoiDungRouteDto })
    nguoi_dung: NguoiDungRouteDto;

    @ApiProperty({ description: 'List of stops', type: [DiemDungResponseDto] })
    diem_dung: DiemDungResponseDto[];

    @ApiProperty({ description: 'Created date' })
    ngay_tao: Date;
}

/**
 * Response for paginated route list
 */
export class LoTrinhListResponseDto {
    @ApiProperty({ type: [LoTrinhResponseDto] })
    data: LoTrinhResponseDto[];

    @ApiProperty({
        description: 'Pagination info',
        example: { page: 1, limit: 20, total: 50, totalPages: 3 },
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Map status code to text
 */
export function mapTrangThaiLoTrinhToText(trangThai: number): string {
    const statusMap: Record<number, string> = {
        [TrangThaiLoTrinh.PENDING]: 'PENDING',
        [TrangThaiLoTrinh.IN_PROGRESS]: 'IN_PROGRESS',
        [TrangThaiLoTrinh.COMPLETED]: 'COMPLETED',
        [TrangThaiLoTrinh.CANCELLED]: 'CANCELLED',
    };
    return statusMap[trangThai] || 'UNKNOWN';
}
