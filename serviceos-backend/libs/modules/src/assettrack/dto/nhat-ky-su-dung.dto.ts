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
        description: 'ID tài sản cần phân công',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID tài sản không được để trống' })
    @IsUUID('4', { message: 'ID tài sản phải là UUID hợp lệ' })
    tai_san_id: string;

    @ApiProperty({
        description: 'ID người dùng cần phân công cho',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID người dùng không được để trống' })
    @IsUUID('4', { message: 'ID người dùng phải là UUID hợp lệ' })
    nguoi_dung_id: string;

    @ApiPropertyOptional({
        description: 'Ngày mượn (YYYY-MM-DD). Mặc định là hôm nay.',
        example: '2026-01-07',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày mượn phải theo định dạng YYYY-MM-DD' })
    ngay_muon?: string;

    @ApiPropertyOptional({
        description: 'Ngày trả dự kiến (YYYY-MM-DD)',
        example: '2026-01-14',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày trả dự kiến phải theo định dạng YYYY-MM-DD' })
    ngay_tra_du_kien?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú về việc phân công',
        example: 'Cho mượn để làm dự án ABC',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
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
        description: 'ID tài sản cần trả lại',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsNotEmpty({ message: 'ID tài sản không được để trống' })
    @IsUUID('4', { message: 'ID tài sản phải là UUID hợp lệ' })
    tai_san_id: string;

    @ApiPropertyOptional({
        description: 'Tình trạng khi trả lại',
        example: 'Bình thường, không hư hỏng',
        maxLength: 255,
    })
    @IsOptional()
    @IsString({ message: 'Tình trạng khi trả phải là chuỗi' })
    @MaxLength(255, { message: 'Tình trạng khi trả tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim())
    tinh_trang_khi_tra?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
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
        description: 'Lọc theo ID tài sản',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID tài sản phải là UUID hợp lệ' })
    tai_san_id?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo ID người mượn',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID người mượn phải là UUID hợp lệ' })
    nguoi_muon_id?: string;

    @ApiPropertyOptional({
        description: 'Chỉ lọc các khoản mượn đang hoạt động (chưa trả lại)',
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

    @ApiPropertyOptional({ example: 'Phòng Kỹ Thuật' })
    phong_ban?: string;
}

/**
 * Response DTO for usage log
 */
export class NhatKySuDungResponseDto {
    @ApiProperty({ description: 'ID nhật ký (UUID)' })
    id: string;

    @ApiProperty({ description: 'ID tài sản' })
    id_tai_san: string;

    @ApiProperty({ description: 'ID người mượn' })
    id_nguoi_muon: string;

    @ApiProperty({ description: 'Ngày mượn' })
    ngay_muon: Date;

    @ApiPropertyOptional({ description: 'Ngày trả dự kiến' })
    ngay_tra_du_kien?: Date;

    @ApiPropertyOptional({ description: 'Ngày trả thực tế' })
    ngay_tra_thuc_te?: Date;

    @ApiPropertyOptional({ description: 'Tình trạng khi trả lại' })
    tinh_trang_khi_tra?: string;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiPropertyOptional({ description: 'Thông tin tài sản', type: TaiSanEmbeddedDto })
    tai_san?: TaiSanEmbeddedDto;

    @ApiPropertyOptional({ description: 'Thông tin người mượn', type: NguoiMuonEmbeddedDto })
    nguoi_muon?: NguoiMuonEmbeddedDto;

    @ApiProperty({ description: 'Đang được mượn', example: true })
    dang_muon: boolean;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;
}

/**
 * Response for assign/return operations
 */
export class AssetOperationResponseDto {
    @ApiProperty({ description: 'Thông báo thành công' })
    message: string;

    @ApiProperty({ description: 'Bản ghi nhật ký sử dụng', type: NhatKySuDungResponseDto })
    data: NhatKySuDungResponseDto;
}

/**
 * Response for paginated usage history
 */
export class NhatKySuDungListResponseDto {
    @ApiProperty({ type: [NhatKySuDungResponseDto] })
    data: NhatKySuDungResponseDto[];

    @ApiProperty({
        description: 'Thông tin phân trang',
        example: { page: 1, limit: 20, total: 50, totalPages: 3 },
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
