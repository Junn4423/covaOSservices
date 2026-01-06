/**
 * Auth Service - Đăng nhập, Đăng ký, JWT Token
 */

import { Injectable, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export interface LoginDto {
    email: string;
    mat_khau: string;
}

export interface RegisterDto {
    email: string;
    mat_khau: string;
    ho_ten: string;
    ten_doanh_nghiep: string;
    so_dien_thoai?: string;
}

/**
 * AuthService sử dụng PrismaClient trực tiếp (không phải PrismaService)
 * để tránh circular dependency với Scope.REQUEST
 * 
 * Các public routes (login, register) không cần tenant filter
 */
@Injectable()
export class AuthService {
    private prisma: PrismaClient;

    constructor(private jwtService: JwtService) {
        // Tạo PrismaClient riêng cho AuthService
        // Vì login/register là public routes, không cần tenant middleware
        this.prisma = new PrismaClient();
    }

    /**
     * Đăng nhập người dùng
     */
    async login(dto: LoginDto) {
        const user = await this.prisma.nguoiDung.findFirst({
            where: {
                email: dto.email,
                trang_thai: 1,
                ngay_xoa: null,
            },
            include: {
                doanh_nghiep: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        const isPasswordValid = await bcrypt.compare(dto.mat_khau, user.mat_khau);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        if (user.doanh_nghiep.trang_thai !== 1) {
            throw new UnauthorizedException('Doanh nghiệp đã bị tạm khóa');
        }

        // Update last login
        await this.prisma.nguoiDung.update({
            where: { id: user.id },
            data: { lan_dang_nhap_cuoi: new Date() },
        });

        // Generate JWT với payload chuẩn
        const payload = {
            sub: user.id,
            email: user.email,
            ho_ten: user.ho_ten,
            tenantId: user.id_doanh_nghiep,  // 🔥 CRITICAL: tenantId cho multi-tenant
            role: user.vai_tro,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                ho_ten: user.ho_ten,
                vai_tro: user.vai_tro,
                doanh_nghiep: {
                    id: user.doanh_nghiep.id,
                    ten: user.doanh_nghiep.ten_doanh_nghiep,
                    goi_cuoc: user.doanh_nghiep.goi_cuoc,
                },
            },
        };
    }

    /**
     * Đăng ký doanh nghiệp mới + tài khoản admin
     */
    async register(dto: RegisterDto) {
        // Check email exists
        const existingUser = await this.prisma.nguoiDung.findFirst({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email đã được sử dụng');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.mat_khau, 10);

        // Create tenant + admin user in transaction
        const result = await this.prisma.$transaction(async (tx) => {
            // Create doanh nghiep (tenant)
            const doanhNghiep = await tx.doanhNghiep.create({
                data: {
                    id: uuidv4(),
                    ten_doanh_nghiep: dto.ten_doanh_nghiep,
                    ma_doanh_nghiep: `DN${Date.now()}`,
                    email: dto.email,
                    so_dien_thoai: dto.so_dien_thoai,
                    goi_cuoc: 'trial',
                    trang_thai: 1,
                },
            });

            // Create admin user
            const user = await tx.nguoiDung.create({
                data: {
                    id: uuidv4(),
                    id_doanh_nghiep: doanhNghiep.id,
                    email: dto.email,
                    mat_khau: hashedPassword,
                    ho_ten: dto.ho_ten,
                    so_dien_thoai: dto.so_dien_thoai,
                    vai_tro: 'admin',
                    trang_thai: 1,
                },
            });

            return { doanhNghiep, user };
        });

        // Generate JWT
        const payload = {
            sub: result.user.id,
            email: result.user.email,
            ho_ten: result.user.ho_ten,
            tenantId: result.doanhNghiep.id,
            role: 'admin',
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: result.user.id,
                email: result.user.email,
                ho_ten: result.user.ho_ten,
                vai_tro: result.user.vai_tro,
            },
            doanh_nghiep: {
                id: result.doanhNghiep.id,
                ten: result.doanhNghiep.ten_doanh_nghiep,
                goi_cuoc: result.doanhNghiep.goi_cuoc,
            },
        };
    }

    /**
     * Refresh token - yêu cầu có token cũ hợp lệ
     */
    async refreshToken(userId: string, tenantId: string, email: string, hoTen: string, role: string) {
        const payload = {
            sub: userId,
            email: email,
            ho_ten: hoTen,
            tenantId: tenantId,
            role: role,
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
