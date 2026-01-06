/**
 * ============================================================
 * AUTH SERVICE - Authentication Service
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@libs/database';
import * as bcrypt from 'bcrypt';

export interface LoginDto {
    email: string;
    password: string;
}

export interface RegisterDto {
    email: string;
    password: string;
    ho_ten: string;
    ten_doanh_nghiep?: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async login(dto: LoginDto) {
        // Tìm user theo email (bypass tenant filter vì chưa login)
        const user = await this.prisma.runAsSystem(async () => {
            return this.prisma.nguoiDung.findFirst({
                where: { email: dto.email, ngay_xoa: null },
                include: {
                    doanh_nghiep: {
                        select: {
                            id: true,
                            ten_doanh_nghiep: true,
                            goi_cuoc: true,
                            trang_thai: true,
                        },
                    },
                },
            });
        });

        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(dto.password, user.mat_khau);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Check user status
        if (user.trang_thai !== 1) {
            throw new UnauthorizedException('Tài khoản đã bị khóa');
        }

        // Check tenant status
        if (user.doanh_nghiep.trang_thai !== 1) {
            throw new UnauthorizedException('Doanh nghiệp đã bị khóa');
        }

        // Generate tokens
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.id_doanh_nghiep,
            role: user.vai_tro,
            ho_ten: user.ho_ten,
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // Update last login
        await this.prisma.runAsSystem(async () => {
            await this.prisma.nguoiDung.update({
                where: { id: user.id },
                data: { lan_dang_nhap_cuoi: new Date() },
            });
        });

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 900, // 15 minutes
            user: {
                id: user.id,
                email: user.email,
                ho_ten: user.ho_ten,
                vai_tro: user.vai_tro,
                doanh_nghiep: user.doanh_nghiep,
            },
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.nguoiDung.findFirst({
            where: { id: userId },
            include: {
                doanh_nghiep: {
                    select: {
                        id: true,
                        ten_doanh_nghiep: true,
                        goi_cuoc: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Không tìm thấy thông tin người dùng');
        }

        return {
            id: user.id,
            email: user.email,
            ho_ten: user.ho_ten,
            so_dien_thoai: user.so_dien_thoai,
            anh_dai_dien: user.anh_dai_dien,
            vai_tro: user.vai_tro,
            phong_ban: user.phong_ban,
            doanh_nghiep: user.doanh_nghiep,
        };
    }
}
