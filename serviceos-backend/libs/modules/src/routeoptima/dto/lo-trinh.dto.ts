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
 * Enum trạng thái lộ trình
 */
export enum TrangThaiLoTrinh {
    PENDING = 0,      // Chưa bắt đầu
    IN_PROGRESS = 1,  // Đang thực hiện
    COMPLETED = 2,    // Đã hoàn thành tất cả điểm dừng
    CANCELLED = 3,    // Đã hủy
}

/**
 * Enum trạng thái điểm dừng
 */
export enum TrangThaiDiemDung {
    PENDING = 0,   // Chưa ghé thăm
    VISITED = 1,   // Đã ghé thăm/Hoàn thành
    SKIPPED = 2,   // Đã bỏ qua
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Chuyển đổi Prisma Decimal thành number cho khoảng cách/tọa độ lộ trình
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
 * Item điểm dừng khi tạo lộ trình
 */
export class CreateDiemDungItemDto {
    @ApiProperty({
        description: 'Thứ tự điểm dừng (1, 2, 3...)',
        example: 1,
        minimum: 1,
    })
    @IsNotEmpty({ message: 'Thứ tự điểm dừng không được để trống' })
    @Type(() => Number)
    @IsInt({ message: 'Thứ tự phải là số nguyên' })
    @Min(1, { message: 'Thứ tự phải >= 1' })
    thu_tu: number;

    @ApiPropertyOptional({
        description: 'Địa chỉ điểm dừng',
        example: '123 Nguyễn Huệ, Q1, HCM',
    })
    @IsOptional()
    @IsString({ message: 'Địa chỉ phải là chuỗi' })
    @Transform(({ value }) => value?.trim())
    dia_chi?: string;

    @ApiPropertyOptional({
        description: 'Tọa độ vĩ độ (Latitude)',
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
        description: 'Tọa độ kinh độ (Longitude)',
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
        description: 'Thời gian đến dự kiến (ISO DateTime)',
        example: '2026-01-07T09:00:00',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Thời gian đến dự kiến phải là định dạng ISO' })
    thoi_gian_den_du_kien?: string;

    @ApiPropertyOptional({
        description: 'ID công việc liên quan',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID công việc phải là UUID hợp lệ' })
    cong_viec_id?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú cho điểm dừng này',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;
}

// ============================================================
// CREATE ROUTE DTO
// ============================================================

/**
 * DTO để tạo lộ trình mới với các điểm dừng
 */
export class CreateLoTrinhDto {
    @ApiProperty({
        description: 'Ngày lộ trình (YYYY-MM-DD)',
        example: '2026-01-07',
    })
    @IsNotEmpty({ message: 'Ngày lộ trình không được để trống' })
    @IsDateString({}, { message: 'Ngày lộ trình phải theo định dạng YYYY-MM-DD' })
    ngay_lo_trinh: string;

    @ApiProperty({
        description: 'ID nhân viên/lái xe',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID người dùng không được để trống' })
    @IsUUID('4', { message: 'ID người dùng phải là UUID hợp lệ' })
    nguoi_dung_id: string;

    @ApiProperty({
        description: 'Danh sách điểm dừng (phải có ít nhất 1)',
        type: [CreateDiemDungItemDto],
    })
    @IsNotEmpty({ message: 'Danh sách điểm dừng không được để trống' })
    @IsArray({ message: 'Danh sách điểm dừng phải là mảng' })
    @ArrayMinSize(1, { message: 'Phải có ít nhất 1 điểm dừng' })
    @ValidateNested({ each: true })
    @Type(() => CreateDiemDungItemDto)
    stops: CreateDiemDungItemDto[];

    @ApiPropertyOptional({
        description: 'Ghi chú cho lộ trình',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;
}

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Tham số truy vấn danh sách lộ trình
 */
export class QueryLoTrinhDto {
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
        description: 'Số items mỗi trang',
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
        description: 'Lọc theo ngày (YYYY-MM-DD)',
        example: '2026-01-07',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày phải theo định dạng YYYY-MM-DD' })
    ngay?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo ID nhân viên',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID người dùng phải là UUID hợp lệ' })
    nguoi_dung_id?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo trạng thái (0=Chưa bắt đầu, 1=Đang thực hiện, 2=Hoàn thành, 3=Đã hủy)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    trang_thai?: number;
}

/**
 * Tham số truy vấn cho getMyRoute
 */
export class QueryMyRouteDto {
    @ApiPropertyOptional({
        description: 'Ngày (YYYY-MM-DD). Mặc định là hôm nay.',
        example: '2026-01-07',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày phải theo định dạng YYYY-MM-DD' })
    ngay?: string;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Thông tin người dùng nhúng
 */
export class NguoiDungRouteDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Nguyễn Văn A' })
    ho_ten: string;

    @ApiPropertyOptional({ example: 'nguyenvana@email.com' })
    email?: string;

    @ApiPropertyOptional({ example: '0901234567' })
    so_dien_thoai?: string;
}

/**
 * Thông tin công việc nhúng
 */
export class CongViecRouteDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiPropertyOptional({ example: 'CV-001' })
    ma_cong_viec?: string;

    @ApiProperty({ example: 'Bảo trì máy lạnh' })
    tieu_de: string;
}

/**
 * DTO phản hồi cho điểm dừng
 */
export class DiemDungResponseDto {
    @ApiProperty({ description: 'ID điểm dừng (UUID)' })
    id: string;

    @ApiProperty({ description: 'Thứ tự điểm dừng', example: 1 })
    thu_tu: number;

    @ApiPropertyOptional({ description: 'Địa chỉ' })
    dia_chi?: string;

    @ApiPropertyOptional({ description: 'Tọa độ vĩ độ' })
    toa_do_lat?: number;

    @ApiPropertyOptional({ description: 'Tọa độ kinh độ' })
    toa_do_lng?: number;

    @ApiPropertyOptional({ description: 'Thời gian đến dự kiến' })
    thoi_gian_den_du_kien?: Date;

    @ApiPropertyOptional({ description: 'Thời gian đến thực tế' })
    thoi_gian_den_thuc_te?: Date;

    @ApiPropertyOptional({ description: 'Thời gian rời đi' })
    thoi_gian_roi_di?: Date;

    @ApiProperty({ description: 'Trạng thái (0=Chưa ghé thăm, 1=Đã ghé thăm, 2=Đã bỏ qua)', example: 0 })
    trang_thai: number;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiPropertyOptional({ description: 'Thông tin công việc liên quan', type: CongViecRouteDto })
    cong_viec?: CongViecRouteDto;
}

/**
 * DTO phản hồi cho lộ trình
 */
export class LoTrinhResponseDto {
    @ApiProperty({ description: 'ID lộ trình (UUID)' })
    id: string;

    @ApiProperty({ description: 'Ngày lộ trình' })
    ngay_lo_trinh: Date;

    @ApiProperty({ description: 'Trạng thái (0=Chưa bắt đầu, 1=Đang thực hiện, 2=Hoàn thành, 3=Đã hủy)', example: 0 })
    trang_thai: number;

    @ApiPropertyOptional({ description: 'Tổng khoảng cách (km)' })
    tong_khoang_cach?: number;

    @ApiPropertyOptional({ description: 'Thời gian bắt đầu' })
    thoi_gian_bat_dau?: Date;

    @ApiPropertyOptional({ description: 'Thời gian kết thúc' })
    thoi_gian_ket_thuc?: Date;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiProperty({ description: 'Thông tin nhân viên', type: NguoiDungRouteDto })
    nguoi_dung: NguoiDungRouteDto;

    @ApiProperty({ description: 'Danh sách điểm dừng', type: [DiemDungResponseDto] })
    diem_dung: DiemDungResponseDto[];

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;
}

/**
 * Phản hồi cho danh sách lộ trình phân trang
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
 * Ánh xạ mã trạng thái thành text
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
