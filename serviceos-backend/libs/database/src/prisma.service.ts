/**
 * ============================================================
 * PRISMA SERVICE - Multi-tenant Row-Level Security
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * 🔥 CRITICAL SECURITY COMPONENT
 * 
 * Middleware này tự động:
 * 1. Inject `id_doanh_nghiep` filter vào mọi READ query
 * 2. Inject `id_doanh_nghiep` vào mọi CREATE operation
 * 3. Track `nguoi_tao_id`, `nguoi_cap_nhat_id` cho audit
 * 4. Convert DELETE thành soft delete
 * 
 * Scope.REQUEST đảm bảo mỗi request có instance riêng
 * để lấy được thông tin user từ JWT Guard.
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Scope, Inject, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

// Interface cho User data từ JWT
export interface RequestUser {
    id: string;
    email: string;
    ho_ten: string;
    vai_tro: string;
    id_doanh_nghiep: string;
    doanh_nghiep?: {
        id: string;
        ten_doanh_nghiep: string;
        goi_cuoc: string;
        trang_thai: number;
    };
}

// Danh sách bảng CẦN có tenant filter (hầu hết các bảng)
const TENANT_TABLES = [
    'NguoiDung',
    'KhachHang',
    'CongViec',
    'PhanCong',
    'NghiemThuHinhAnh',
    'CaLamViec',
    'ChamCong',
    'Kho',
    'SanPham',
    'TonKho',
    'LichSuKho',
    'TaiSan',
    'NhatKySuDung',
    'LoTrinh',
    'DiemDung',
    'BaoGia',
    'ChiTietBaoGia',
    'HopDong',
    'PhieuThuChi',
    'TaiKhoanKhach',
    'DanhGia',
    'NhaCungCap',
    'DonDatHangNcc',
    'ChiTietDonDatHang',
    'ThongBao',
];

// Bảng KHÔNG cần tenant filter (system tables)
const SYSTEM_TABLES = ['DoanhNghiep', 'ThanhToanSaas'];

@Injectable({ scope: Scope.REQUEST }) // 🔥 Scope REQUEST để lấy được user mỗi request
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(@Inject(REQUEST) private request: Request) {
        super({
            log: process.env.NODE_ENV === 'development'
                ? ['warn', 'error']
                : ['error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.applyTenantMiddleware();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    /**
     * Lấy user từ request (được set bởi JWT Guard)
     */
    private getUser(): RequestUser | null {
        return (this.request as any)?.user || null;
    }

    /**
     * Lấy tenant ID từ user hiện tại
     */
    private getTenantId(): string | null {
        return this.getUser()?.id_doanh_nghiep || null;
    }

    /**
     * Lấy user ID cho audit trail
     */
    private getUserId(): string | null {
        return this.getUser()?.id || null;
    }

    /**
     * Kiểm tra model có cần tenant filter không
     */
    private requiresTenantFilter(model: string | undefined): boolean {
        if (!model) return false;
        return TENANT_TABLES.includes(model);
    }

    /**
     * ============================================================
     * 🔥 CORE: Multi-tenant Middleware
     * ============================================================
     * 
     * Tự động inject tenant ID vào mọi query để đảm bảo
     * dữ liệu của tenant A không thể truy cập bởi tenant B
     */
    private applyTenantMiddleware() {
        this.$use(async (params, next) => {
            const tenantId = this.getTenantId();
            const userId = this.getUserId();
            const { model, action } = params;

            // Skip nếu:
            // 1. Không có model
            // 2. Không có tenantId (public routes, system operations)
            // 3. Model không cần tenant filter
            if (!model || !tenantId || !this.requiresTenantFilter(model)) {
                return next(params);
            }

            // Initialize args nếu chưa có
            if (!params.args) params.args = {};

            // ============================================================
            // 1. READ Operations: Tự động thêm WHERE tenant filter
            // ============================================================
            if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(action)) {
                if (!params.args.where) params.args.where = {};

                // Chỉ thêm nếu chưa có (cho phép admin override nếu cần)
                if (params.args.where.id_doanh_nghiep === undefined) {
                    params.args.where.id_doanh_nghiep = tenantId;
                }

                // Soft delete filter: Mặc định chỉ lấy record chưa xóa
                if (params.args.where.ngay_xoa === undefined) {
                    params.args.where.ngay_xoa = null;
                }

                this.logger.debug(
                    `[READ] ${model}.${action} - Tenant: ${tenantId.substring(0, 8)}...`
                );
            }

            // ============================================================
            // 2. CREATE Operations: Tự động gán tenantId và audit fields
            // ============================================================
            if (action === 'create') {
                if (!params.args.data) params.args.data = {};

                // Inject tenant ID
                params.args.data.id_doanh_nghiep = tenantId;

                // Inject audit fields
                if (userId) {
                    params.args.data.nguoi_tao_id = userId;
                    params.args.data.nguoi_cap_nhat_id = userId;
                }

                this.logger.debug(
                    `[CREATE] ${model} - Tenant: ${tenantId.substring(0, 8)}..., User: ${userId?.substring(0, 8)}...`
                );
            }

            if (action === 'createMany') {
                if (params.args.data && Array.isArray(params.args.data)) {
                    params.args.data = params.args.data.map((item: any) => ({
                        ...item,
                        id_doanh_nghiep: tenantId,
                        nguoi_tao_id: userId,
                        nguoi_cap_nhat_id: userId,
                    }));
                }

                this.logger.debug(
                    `[CREATE_MANY] ${model} - Count: ${params.args.data?.length || 0}`
                );
            }

            // ============================================================
            // 3. UPDATE Operations: Thêm tenant filter + audit
            // ============================================================
            if (['update', 'updateMany'].includes(action)) {
                if (!params.args.where) params.args.where = {};
                if (!params.args.data) params.args.data = {};

                // Inject tenant filter để không update nhầm tenant khác
                if (params.args.where.id_doanh_nghiep === undefined) {
                    params.args.where.id_doanh_nghiep = tenantId;
                }

                // Update audit field
                if (userId) {
                    params.args.data.nguoi_cap_nhat_id = userId;
                }

                this.logger.debug(
                    `[UPDATE] ${model}.${action} - Tenant: ${tenantId.substring(0, 8)}...`
                );
            }

            // ============================================================
            // 4. DELETE Operations: Convert to Soft Delete
            // ============================================================
            if (action === 'delete') {
                // Chuyển delete thành update (soft delete)
                params.action = 'update';

                if (!params.args.where) params.args.where = {};
                params.args.where.id_doanh_nghiep = tenantId;

                params.args.data = {
                    ngay_xoa: new Date(),
                    nguoi_cap_nhat_id: userId,
                };

                this.logger.debug(
                    `[SOFT_DELETE] ${model} - Converted to update`
                );
            }

            if (action === 'deleteMany') {
                // Chuyển deleteMany thành updateMany
                params.action = 'updateMany';

                if (!params.args.where) params.args.where = {};
                params.args.where.id_doanh_nghiep = tenantId;

                params.args.data = {
                    ngay_xoa: new Date(),
                    nguoi_cap_nhat_id: userId,
                };

                this.logger.debug(
                    `[SOFT_DELETE_MANY] ${model} - Converted to updateMany`
                );
            }

            return next(params);
        });
    }

    // ============================================================
    // UTILITY METHODS
    // ============================================================

    /**
     * Lấy tenant ID hiện tại (public method cho services sử dụng)
     */
    getCurrentTenantId(): string | null {
        return this.getTenantId();
    }

    /**
     * Lấy user ID hiện tại
     */
    getCurrentUserId(): string | null {
        return this.getUserId();
    }

    /**
     * Lấy user data hiện tại
     */
    getCurrentUser(): RequestUser | null {
        return this.getUser();
    }

    /**
     * Thực thi raw query với tenant filter thủ công
     * Dùng cho các trường hợp cần raw SQL
     */
    async executeRawWithTenant<T = unknown>(
        query: TemplateStringsArray,
        ...values: unknown[]
    ): Promise<T> {
        const tenantId = this.getTenantId();
        if (!tenantId) {
            throw new Error('Tenant ID is required for raw queries');
        }
        // Caller phải tự thêm tenant filter vào query
        return this.$queryRaw(query, ...values) as Promise<T>;
    }

    /**
     * Transaction helper với context
     */
    async transactionWithContext<T>(
        fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
    ): Promise<T> {
        return this.$transaction(async (tx) => {
            // Transaction sẽ kế thừa middleware từ parent
            return fn(tx);
        });
    }
}
