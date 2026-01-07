/**
 * ============================================================
 * DTOs - AssetTrack Module (Nhat Ky Su Dung - Asset Usage Log)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Asset assignment and return DTOs:
 * - Assign asset to user
 * - Return asset from user
 * - Query usage history
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNotEmpty,
    MaxLength,
    IsUUID,
    IsDateString,
    IsInt,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ASSIGN ASSET DTO
// ============================================================

/**
 * DTO to assign an asset to a user
 */
export class AssignAssetDto {
    @ApiProperty({
        description: 'Asset ID to assign',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID tai san khong duoc de trong' })
    @IsUUID('4', { message: 'ID tai san phai la UUID hop le' })
    tai_san_id: string;

    @ApiProperty({
        description: 'User ID to assign to',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID nguoi dung khong duoc de trong' })
    @IsUUID('4', { message: 'ID nguoi dung phai la UUID hop le' })
    nguoi_dung_id: string;

    @ApiPropertyOptional({
        description: 'Borrow date (YYYY-MM-DD). Defaults to today.',
        example: '2026-01-07',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay muon phai theo dinh dang YYYY-MM-DD' })
    ngay_muon?: string;

    @ApiPropertyOptional({
        description: 'Expected return date (YYYY-MM-DD)',
        example: '2026-01-14',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngay tra du kien phai theo dinh dang YYYY-MM-DD' })
    ngay_tra_du_kien?: string;

    @ApiPropertyOptional({
        description: 'Notes about the assignment',
        example: 'Cho muon de lam du an ABC',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chu phai la chuoi' })
    ghi_chu?: string;
}

// ============================================================
// RETURN ASSET DTO
// ============================================================

/**
 * DTO to return an asset
 */
export class ReturnAssetDto {
    @ApiProperty({
        description: 'Asset ID to return',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID tai san khong duoc de trong' })
    @IsUUID('4', { message: 'ID tai san phai la UUID hop le' })
    tai_san_id: string;

    @ApiPropertyOptional({
        description: 'Condition when returned',
        example: 'Binh thuong, khong hu hong',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Tinh trang khi tra phai la chuoi' })
    @MaxLength(255, { message: 'Tinh trang khi tra toi da 255 ky tu' })
    @Transform(({ value }) => value?.trim())
    tinh_trang_khi_tra?: string;

    @ApiPropertyOptional({
        description: 'Notes',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chu phai la chuoi' })
    ghi_chu?: string;
}

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Query params for usage history
 */
export class QueryNhatKySuDungDto {
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
        description: 'Filter by asset ID',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID tai san phai la UUID hop le' })
    tai_san_id?: string;

    @ApiPropertyOptional({
        description: 'Filter by user ID (borrower)',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID nguoi muon phai la UUID hop le' })
    nguoi_muon_id?: string;

    @ApiPropertyOptional({
        description: 'Filter active loans only (not yet returned)',
        default: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    chua_tra?: boolean;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Embedded asset info
 */
export class TaiSanEmbeddedDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiPropertyOptional({ example: 'TS-001' })
    ma_tai_san?: string;

    @ApiProperty({ example: 'Laptop Dell XPS 15' })
    ten_tai_san: string;

    @ApiPropertyOptional({ example: 'SN-ABC123456' })
    ma_seri?: string;
}

/**
 * Embedded user info
 */
export class NguoiMuonEmbeddedDto {
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
 * Response DTO for usage log
 */
export class NhatKySuDungResponseDto {
    @ApiProperty({ description: 'Log ID (UUID)' })
    id: string;

    @ApiProperty({ description: 'Asset ID' })
    id_tai_san: string;

    @ApiProperty({ description: 'Borrower ID' })
    id_nguoi_muon: string;

    @ApiProperty({ description: 'Borrow date' })
    ngay_muon: Date;

    @ApiPropertyOptional({ description: 'Expected return date' })
    ngay_tra_du_kien?: Date;

    @ApiPropertyOptional({ description: 'Actual return date' })
    ngay_tra_thuc_te?: Date;

    @ApiPropertyOptional({ description: 'Condition when returned' })
    tinh_trang_khi_tra?: string;

    @ApiPropertyOptional({ description: 'Notes' })
    ghi_chu?: string;

    @ApiPropertyOptional({ description: 'Asset info', type: TaiSanEmbeddedDto })
    tai_san?: TaiSanEmbeddedDto;

    @ApiPropertyOptional({ description: 'Borrower info', type: NguoiMuonEmbeddedDto })
    nguoi_muon?: NguoiMuonEmbeddedDto;

    @ApiProperty({ description: 'Is currently on loan', example: true })
    dang_muon: boolean;

    @ApiProperty({ description: 'Created date' })
    ngay_tao: Date;
}

/**
 * Response for assign/return operations
 */
export class AssetOperationResponseDto {
    @ApiProperty({ description: 'Success message' })
    message: string;

    @ApiProperty({ description: 'Usage log record', type: NhatKySuDungResponseDto })
    data: NhatKySuDungResponseDto;
}

/**
 * Response for paginated usage history
 */
export class NhatKySuDungListResponseDto {
    @ApiProperty({ type: [NhatKySuDungResponseDto] })
    data: NhatKySuDungResponseDto[];

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
