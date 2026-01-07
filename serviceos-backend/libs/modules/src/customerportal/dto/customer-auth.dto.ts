/**
 * ============================================================
 * CUSTOMER AUTH DTO - CustomerPortal Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * DTOs cho xác thực khách hàng:
 * - CustomerRegisterDto: Đăng ký tài khoản khách hàng mới
 * - CustomerLoginDto: Đăng nhập với email và mật khẩu
 * - CustomerAuthResponseDto: Phản hồi JWT token
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsUUID,
    MinLength,
    MaxLength,
    IsOptional,
} from 'class-validator';

// ============================================================
// CUSTOMER REGISTER DTO
// ============================================================

export class CustomerRegisterDto {
    @ApiProperty({
        description: 'Email để đăng nhập cổng khách hàng',
        example: 'customer@example.com',
    })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({
        description: 'Mật khẩu (tối thiểu 6 ký tự)',
        example: 'securepassword123',
    })
    @IsString()
    @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    @MaxLength(100, { message: 'Mật khẩu quá dài' })
    password: string;

    @ApiProperty({
        description: 'Liên kết đến khách hàng CRM hiện có (KhachHang.id)',
        example: 'uuid-khach-hang',
    })
    @IsUUID('all', { message: 'ID khách hàng không hợp lệ' })
    khach_hang_id: string;
}

// ============================================================
// CUSTOMER LOGIN DTO
// ============================================================

export class CustomerLoginDto {
    @ApiProperty({
        description: 'Email khách hàng',
        example: 'customer@example.com',
    })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    email: string;

    @ApiProperty({
        description: 'Mật khẩu',
        example: 'securepassword123',
    })
    @IsString()
    password: string;
}

// ============================================================
// CUSTOMER AUTH RESPONSE DTO
// ============================================================

export class CustomerAuthResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    access_token: string;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    refresh_token: string;

    @ApiProperty({ example: 900, description: 'Thời gian hết hạn token (giây) - 15 phút' })
    expires_in: number;

    @ApiProperty({
        description: 'Thông tin khách hàng',
        example: {
            id: 'uuid-tai-khoan-khach',
            email: 'customer@example.com',
            khach_hang: {
                id: 'uuid-khach-hang',
                ho_ten: 'Nguyễn Văn A',
                so_dien_thoai: '0901234567',
            },
        },
    })
    customer: {
        id: string;
        email: string;
        khach_hang: {
            id: string;
            ho_ten: string;
            so_dien_thoai: string | null;
            email: string | null;
            dia_chi: string | null;
        };
    };
}

// ============================================================
// CUSTOMER PROFILE RESPONSE DTO
// ============================================================

export class CustomerProfileResponseDto {
    @ApiProperty({ example: 'uuid-tai-khoan-khach' })
    id: string;

    @ApiProperty({ example: 'customer@example.com' })
    email: string;

    @ApiProperty({
        description: 'Thông tin khách hàng liên kết từ CRM',
    })
    khach_hang: {
        id: string;
        ma_khach_hang: string | null;
        ho_ten: string;
        so_dien_thoai: string | null;
        email: string | null;
        dia_chi: string | null;
        thanh_pho: string | null;
        quan_huyen: string | null;
        loai_khach: string;
    };
}
