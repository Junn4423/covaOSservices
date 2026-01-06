/**
 * ============================================================
 * DTOs - TechMate Khách Hàng Module
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import { ApiProperty, ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsOptional,
    IsEnum,
    IsNotEmpty,
    MaxLength,
    IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Enum nguồn khách hàng - match với Prisma schema
 */
export enum NguonKhach {
    FACEBOOK = 'FACEBOOK',
    WEBSITE = 'WEBSITE',
    REFERRAL = 'REFERRAL',
    KHAC = 'KHAC',
}

/**
 * Enum loại khách hàng
 */
export enum LoaiKhach {
    CA_NHAN = 'ca_nhan',
    DOANH_NGHIEP = 'doanh_nghiep',
}

// ============================================================
// CREATE DTO
// ============================================================

/**
 * DTO để tạo khách hàng mới
 * 
 * @example
 * {
 *   "ho_ten": "Nguyễn Văn A",
 *   "so_dien_thoai": "0901234567",
 *   "email": "nguyenvana@gmail.com",
 *   "dia_chi": "123 Đường ABC, Quận 1, TP.HCM",
 *   "nguon_khach": "FACEBOOK",
 *   "ghi_chu": "Khách hàng tiềm năng"
 * }
 */
export class CreateKhachHangDto {
    @ApiPropertyOptional({
        description: 'Mã khách hàng (auto-generate nếu không gửi)',
        example: 'KH-001',
        maxLength: 50,
    })
    @IsOptional()
    @IsString({ message: 'Mã khách hàng phải là chuỗi' })
    @MaxLength(50, { message: 'Mã khách hàng tối đa 50 ký tự' })
    @Transform(({ value }) => value?.trim())
    ma_khach_hang?: string;

    @ApiProperty({
        description: 'Họ và tên khách hàng',
        example: 'Nguyễn Văn A',
        maxLength: 255,
    })
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    @IsString({ message: 'Họ tên phải là chuỗi' })
    @MaxLength(255, { message: 'Họ tên tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim())
    ho_ten: string;

    @ApiPropertyOptional({
        description: 'Số điện thoại',
        example: '0901234567',
        maxLength: 20,
    })
    @IsOptional()
    @IsString({ message: 'Số điện thoại phải là chuỗi' })
    @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
    @Transform(({ value }) => value?.trim())
    so_dien_thoai?: string;

    @ApiPropertyOptional({
        description: 'Email',
        example: 'nguyenvana@gmail.com',
        maxLength: 255,
    })
    @IsOptional()
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @MaxLength(255, { message: 'Email tối đa 255 ký tự' })
    @Transform(({ value }) => value?.trim().toLowerCase())
    email?: string;

    @ApiPropertyOptional({
        description: 'Địa chỉ chi tiết',
        example: '123 Đường ABC, Phường XYZ, Quận 1, TP.HCM',
    })
    @IsOptional()
    @IsString({ message: 'Địa chỉ phải là chuỗi' })
    @Transform(({ value }) => value?.trim())
    dia_chi?: string;

    @ApiPropertyOptional({
        description: 'Thành phố',
        example: 'TP. Hồ Chí Minh',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Thành phố phải là chuỗi' })
    @MaxLength(100, { message: 'Thành phố tối đa 100 ký tự' })
    @Transform(({ value }) => value?.trim())
    thanh_pho?: string;

    @ApiPropertyOptional({
        description: 'Quận/Huyện',
        example: 'Quận 1',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Quận/Huyện phải là chuỗi' })
    @MaxLength(100, { message: 'Quận/Huyện tối đa 100 ký tự' })
    @Transform(({ value }) => value?.trim())
    quan_huyen?: string;

    @ApiPropertyOptional({
        description: 'Loại khách hàng',
        enum: LoaiKhach,
        default: LoaiKhach.CA_NHAN,
    })
    @IsOptional()
    @IsEnum(LoaiKhach, { message: 'Loại khách không hợp lệ' })
    loai_khach?: LoaiKhach;

    @ApiPropertyOptional({
        description: 'Nguồn khách hàng',
        enum: NguonKhach,
        default: NguonKhach.KHAC,
        example: 'FACEBOOK',
    })
    @IsOptional()
    @IsEnum(NguonKhach, { message: 'Nguồn khách không hợp lệ (FACEBOOK, WEBSITE, REFERRAL, KHAC)' })
    nguon_khach?: NguonKhach;

    @ApiPropertyOptional({
        description: 'Ghi chú',
        example: 'Khách hàng tiềm năng, cần follow up định kỳ',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    @Transform(({ value }) => value?.trim())
    ghi_chu?: string;
}

// ============================================================
// UPDATE DTO
// ============================================================

/**
 * DTO để cập nhật thông tin khách hàng
 * Tất cả các field đều optional
 */
export class UpdateKhachHangDto extends PartialType(CreateKhachHangDto) { }

// ============================================================
// QUERY DTO
// ============================================================

/**
 * DTO cho query params khi tìm kiếm khách hàng
 */
export class QueryKhachHangDto {
    @ApiPropertyOptional({
        description: 'Số trang (bắt đầu từ 1)',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10) || 1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số lượng bản ghi mỗi trang',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Transform(({ value }) => Math.min(parseInt(value, 10) || 20, 100))
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm (theo tên, SĐT, email)',
        example: 'Nguyễn',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo nguồn khách',
        enum: NguonKhach,
    })
    @IsOptional()
    @IsEnum(NguonKhach)
    nguon_khach?: NguonKhach;

    @ApiPropertyOptional({
        description: 'Lọc theo loại khách',
        enum: LoaiKhach,
    })
    @IsOptional()
    @IsEnum(LoaiKhach)
    loai_khach?: LoaiKhach;
}

// ============================================================
// RESPONSE DTOs (for Swagger documentation)
// ============================================================

/**
 * Response DTO cho một khách hàng
 */
export class KhachHangResponseDto {
    @ApiProperty({ description: 'ID khách hàng (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ description: 'Mã khách hàng', example: 'KH-1704585600000' })
    ma_khach_hang: string;

    @ApiProperty({ description: 'Họ và tên', example: 'Nguyễn Văn A' })
    ho_ten: string;

    @ApiPropertyOptional({ description: 'Số điện thoại', example: '0901234567' })
    so_dien_thoai?: string;

    @ApiPropertyOptional({ description: 'Email', example: 'nguyenvana@gmail.com' })
    email?: string;

    @ApiPropertyOptional({ description: 'Địa chỉ' })
    dia_chi?: string;

    @ApiPropertyOptional({ description: 'Thành phố' })
    thanh_pho?: string;

    @ApiPropertyOptional({ description: 'Quận/Huyện' })
    quan_huyen?: string;

    @ApiProperty({ description: 'Loại khách', enum: LoaiKhach })
    loai_khach: LoaiKhach;

    @ApiProperty({ description: 'Nguồn khách', enum: NguonKhach })
    nguon_khach: NguonKhach;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;
}

/**
 * Response metadata cho phân trang
 */
export class PaginationMetaDto {
    @ApiProperty({ description: 'Trang hiện tại', example: 1 })
    page: number;

    @ApiProperty({ description: 'Số items mỗi trang', example: 20 })
    limit: number;

    @ApiProperty({ description: 'Tổng số items', example: 150 })
    total: number;

    @ApiProperty({ description: 'Tổng số trang', example: 8 })
    totalPages: number;
}

/**
 * Response DTO cho danh sách khách hàng có phân trang
 */
export class KhachHangListResponseDto {
    @ApiProperty({
        description: 'Danh sách khách hàng',
        type: [KhachHangResponseDto],
    })
    data: KhachHangResponseDto[];

    @ApiProperty({
        description: 'Thông tin phân trang',
        type: PaginationMetaDto,
    })
    meta: PaginationMetaDto;
}
