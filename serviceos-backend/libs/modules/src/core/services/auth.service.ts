/**
 * ============================================================
 * AUTH SERVICE - Authentication Service
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@libs/database';
import { HanhDong } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginRequestDto, RefreshTokenDto, RegisterTenantDto } from '../dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async login(dto: LoginRequestDto) {
        const providedPassword = dto.password ?? dto.mat_khau;

        if (!providedPassword) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

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
        const isPasswordValid = await bcrypt.compare(providedPassword, user.mat_khau);
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

            // Ghi audit log cho hành động đăng nhập
            await this.prisma.nhatKyHoatDong.create({
                data: {
                    id_doanh_nghiep: user.id_doanh_nghiep,
                    nguoi_thuc_hien_id: user.id,
                    hanh_dong: HanhDong.LOGIN,
                    doi_tuong: 'NguoiDung',
                    id_doi_tuong: user.id,
                    mo_ta: 'Đăng nhập hệ thống',
                    endpoint: '/auth/login',
                },
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

    async registerTenant(dto: RegisterTenantDto) {
        const shouldCreateAdmin = !!dto.admin_email;

        if (shouldCreateAdmin) {
            if (!dto.mat_khau) {
                throw new BadRequestException('Mật khẩu admin là bắt buộc');
            }

            if (!dto.admin_ho_ten) {
                throw new BadRequestException('Họ tên admin là bắt buộc');
            }
        }

        try {
            const result = await this.prisma.runAsSystem(async () => {
                return this.prisma.$transaction(async (tx) => {
                    const tenant = await tx.doanhNghiep.create({
                        data: {
                            ten_doanh_nghiep: dto.ten_doanh_nghiep,
                            ma_doanh_nghiep: dto.ma_doanh_nghiep,
                            email: dto.email,
                            so_dien_thoai: dto.so_dien_thoai,
                            dia_chi: dto.dia_chi,
                            goi_cuoc: (dto.goi_cuoc as any) || 'trial',
                            trang_thai: 1,
                        },
                    });

                    let adminUser: any = null;

                    if (shouldCreateAdmin && dto.admin_email && dto.mat_khau && dto.admin_ho_ten) {
                        const hashedPassword = await bcrypt.hash(dto.mat_khau, 10);

                        adminUser = await tx.nguoiDung.upsert({
                            where: {
                                id_doanh_nghiep_email: {
                                    id_doanh_nghiep: tenant.id,
                                    email: dto.admin_email,
                                },
                            },
                            update: {
                                mat_khau: hashedPassword,
                                ho_ten: dto.admin_ho_ten,
                                vai_tro: 'admin',
                                trang_thai: 1,
                            },
                            create: {
                                id_doanh_nghiep: tenant.id,
                                email: dto.admin_email,
                                mat_khau: hashedPassword,
                                ho_ten: dto.admin_ho_ten,
                                vai_tro: 'admin',
                                trang_thai: 1,
                            },
                        });
                    }

                    return { tenant, adminUser };
                });
            });

            let tokenBundle: any = {};

            if (result.adminUser) {
                const payload = {
                    sub: result.adminUser.id,
                    email: result.adminUser.email,
                    tenantId: result.tenant.id,
                    role: result.adminUser.vai_tro,
                    ho_ten: result.adminUser.ho_ten,
                };

                tokenBundle = {
                    access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
                    refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
                    expires_in: 900,
                };

                await this.prisma.runAsSystem(async () => {
                    await this.prisma.nhatKyHoatDong.create({
                        data: {
                            id_doanh_nghiep: result.tenant.id,
                            nguoi_thuc_hien_id: result.adminUser.id,
                            hanh_dong: HanhDong.REGISTER,
                            doi_tuong: 'DoanhNghiep',
                            id_doi_tuong: result.tenant.id,
                            mo_ta: 'Đăng ký tenant mới',
                            endpoint: '/auth/register-tenant',
                        },
                    });
                });
            }

            return {
                id: result.tenant.id,
                tenant: result.tenant,
                admin: result.adminUser
                    ? {
                        id: result.adminUser.id,
                        email: result.adminUser.email,
                        ho_ten: result.adminUser.ho_ten,
                    }
                    : undefined,
                ...tokenBundle,
            };
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException('Tenant hoặc email đã tồn tại');
            }
            throw error;
        }
    }

    async refreshToken(dto: RefreshTokenDto) {
        try {
            const payload = this.jwtService.verify(dto.refresh_token);

            const newPayload = {
                sub: payload.sub,
                email: payload.email,
                tenantId: payload.tenantId,
                role: payload.role,
                ho_ten: payload.ho_ten,
            };

            const accessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
            const refreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' });

            return {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_in: 900,
            };
        } catch (error) {
            throw new UnauthorizedException('Refresh token không hợp lệ');
        }
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
