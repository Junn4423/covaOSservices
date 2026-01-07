/**
 * ============================================================
 * CUSTOMER AUTH SERVICE - CustomerPortal Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Xác thực cho cổng khách hàng (TaiKhoanKhach):
 * - register: Tạo tài khoản khách hàng liên kết đến khách hàng CRM hiện có
 * - login: Xác thực thông tin đăng nhập và trả về JWT với cờ is_customer
 * - getProfile: Lấy thông tin hồ sơ khách hàng với thông tin KhachHang liên kết
 * 
 * LƯU Ý: Khách hàng được lưu trong TaiKhoanKhach, KHÔNG PHẢI NguoiDung
 * JWT payload bao gồm is_customer: true để phân biệt với nhân viên
 */

import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@libs/database';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import {
    CustomerRegisterDto,
    CustomerLoginDto,
} from '../dto/customer-auth.dto';

// Customer JWT Payload - khác với nhân viên
export interface CustomerJwtPayload {
    sub: string;           // TaiKhoanKhach.id
    email: string;
    tenantId: string;      // id_doanh_nghiep
    khach_hang_id: string; // KhachHang.id
    is_customer: true;     // Phân biệt với token nhân viên
    iat?: number;
    exp?: number;
}

@Injectable()
export class CustomerAuthService {
    private readonly logger = new Logger(CustomerAuthService.name);
    private readonly SALT_ROUNDS = 10;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    // ============================================================
    // REGISTER - Tạo tài khoản khách hàng
    // ============================================================
    /**
     * Đăng ký tài khoản cổng khách hàng mới
     * Liên kết đến khách hàng CRM hiện có (KhachHang) thông qua khach_hang_id
     * 
     * @param dto - Dữ liệu đăng ký
     * @param tenantId - ID doanh nghiệp
     */
    async register(dto: CustomerRegisterDto, tenantId: string) {
        // 1. Kiểm tra KhachHang tồn tại và thuộc tenant
        const khachHang = await this.prisma.runAsSystem(async () => {
            return this.prisma.khachHang.findFirst({
                where: {
                    id: dto.khach_hang_id,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
            });
        });

        if (!khachHang) {
            throw new NotFoundException('Không tìm thấy khách hàng');
        }

        // 2. Kiểm tra email đã đăng ký trong tenant này chưa
        const existingAccount = await this.prisma.runAsSystem(async () => {
            return this.prisma.taiKhoanKhach.findFirst({
                where: {
                    email: dto.email,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
            });
        });

        if (existingAccount) {
            throw new ConflictException('Email đã được đăng ký');
        }

        // 3. Kiểm tra KhachHang đã có tài khoản chưa
        const existingAccountForCustomer = await this.prisma.runAsSystem(async () => {
            return this.prisma.taiKhoanKhach.findFirst({
                where: {
                    id_khach_hang: dto.khach_hang_id,
                    ngay_xoa: null,
                },
            });
        });

        if (existingAccountForCustomer) {
            throw new ConflictException('Khách hàng này đã có tài khoản');
        }

        // 4. Hash mật khẩu
        const hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

        // 5. Tạo bản ghi TaiKhoanKhach
        const taiKhoanKhach = await this.prisma.runAsSystem(async () => {
            return this.prisma.taiKhoanKhach.create({
                data: {
                    id: uuidv4(),
                    id_doanh_nghiep: tenantId,
                    id_khach_hang: dto.khach_hang_id,
                    email: dto.email,
                    mat_khau: hashedPassword,
                    trang_thai: 1,
                },
                include: {
                    khach_hang: {
                        select: {
                            id: true,
                            ho_ten: true,
                            so_dien_thoai: true,
                            email: true,
                        },
                    },
                },
            });
        });

        this.logger.log(`Đã tạo tài khoản khách hàng: ${dto.email} cho KhachHang ${dto.khach_hang_id}`);

        return {
            id: taiKhoanKhach.id,
            email: taiKhoanKhach.email,
            khach_hang: taiKhoanKhach.khach_hang,
            message: 'Đăng ký tài khoản thành công',
        };
    }

    // ============================================================
    // LOGIN - Xác thực thông tin đăng nhập và trả về JWT
    // ============================================================
    /**
     * Đăng nhập khách hàng
     * Trả về JWT với is_customer: true trong payload
     */
    async login(dto: CustomerLoginDto) {
        // 1. Tìm tài khoản theo email (bỏ qua tenant filter)
        const taiKhoanKhach = await this.prisma.runAsSystem(async () => {
            return this.prisma.taiKhoanKhach.findFirst({
                where: {
                    email: dto.email,
                    ngay_xoa: null,
                },
                include: {
                    khach_hang: {
                        select: {
                            id: true,
                            ho_ten: true,
                            so_dien_thoai: true,
                            email: true,
                            dia_chi: true,
                        },
                    },
                    doanh_nghiep: {
                        select: {
                            id: true,
                            ten_doanh_nghiep: true,
                            trang_thai: true,
                        },
                    },
                },
            });
        });

        if (!taiKhoanKhach) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // 2. Xác minh mật khẩu
        const isPasswordValid = await bcrypt.compare(dto.password, taiKhoanKhach.mat_khau);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // 3. Kiểm tra trạng thái tài khoản
        if (taiKhoanKhach.trang_thai !== 1) {
            throw new UnauthorizedException('Tài khoản đã bị khóa');
        }

        // 4. Kiểm tra trạng thái tenant
        if (taiKhoanKhach.doanh_nghiep.trang_thai !== 1) {
            throw new UnauthorizedException('Doanh nghiệp đã bị khóa');
        }

        // 5. Tạo JWT với payload riêng cho khách hàng
        const payload: CustomerJwtPayload = {
            sub: taiKhoanKhach.id,
            email: taiKhoanKhach.email,
            tenantId: taiKhoanKhach.id_doanh_nghiep,
            khach_hang_id: taiKhoanKhach.id_khach_hang,
            is_customer: true,
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        // 6. Cập nhật lần đăng nhập cuối
        await this.prisma.runAsSystem(async () => {
            await this.prisma.taiKhoanKhach.update({
                where: { id: taiKhoanKhach.id },
                data: { lan_dang_nhap_cuoi: new Date() },
            });
        });

        this.logger.log(`Khách hàng đã đăng nhập: ${dto.email}`);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: 900,
            customer: {
                id: taiKhoanKhach.id,
                email: taiKhoanKhach.email,
                khach_hang: taiKhoanKhach.khach_hang,
            },
        };
    }

    // ============================================================
    // GET PROFILE - Lấy hồ sơ khách hàng với thông tin KhachHang
    // ============================================================
    async getProfile(accountId: string) {
        const taiKhoanKhach = await this.prisma.runAsSystem(async () => {
            return this.prisma.taiKhoanKhach.findFirst({
                where: {
                    id: accountId,
                    ngay_xoa: null,
                },
                include: {
                    khach_hang: {
                        select: {
                            id: true,
                            ma_khach_hang: true,
                            ho_ten: true,
                            so_dien_thoai: true,
                            email: true,
                            dia_chi: true,
                            thanh_pho: true,
                            quan_huyen: true,
                            loai_khach: true,
                        },
                    },
                },
            });
        });

        if (!taiKhoanKhach) {
            throw new NotFoundException('Không tìm thấy thông tin tài khoản');
        }

        return {
            id: taiKhoanKhach.id,
            email: taiKhoanKhach.email,
            khach_hang: taiKhoanKhach.khach_hang,
        };
    }
}
