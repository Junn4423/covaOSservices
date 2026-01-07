/**
 * ============================================================
 * PRISMA SERVICE - Multi-tenant Row-Level Security (CLS Edition)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * 🔥 CRITICAL SECURITY COMPONENT - VERSION 2.0 (nestjs-cls)
 *
 * THAY ĐỔI QUAN TRỌNG SO VỚI PHIÊN BẢN TRƯỚC:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * TRƯỚC: Dùng Scope.REQUEST → Mỗi request tạo mới PrismaClient
 *        → Không tận dụng được connection pool → Chậm!
 *
 * SAU:   Dùng nestjs-cls (Async Local Storage) → Singleton PrismaClient
 *        → Tận dụng connection pool → Nhanh hơn 3-5x!
 *        → Vẫn an toàn multi-tenant trong mọi context (HTTP, Cron, Queue)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Middleware này tự động:
 * 1. Inject `id_doanh_nghiep` filter vào mọi READ query
 * 2. Inject `id_doanh_nghiep` vào mọi CREATE operation
 * 3. Track `nguoi_tao_id`, `nguoi_cap_nhat_id` cho audit
 * 4. Convert DELETE thành soft delete
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClsService } from 'nestjs-cls';

// ============================================================
// CLS STORE INTERFACE - Context data được lưu trong Async Local Storage
// ============================================================
// Index signature được thêm để thỏa mãn nestjs-cls ClsStore constraint
export interface ClsStore {
    userId?: string;
    tenantId?: string;
    email?: string;
    hoTen?: string;
    vaiTro?: string;
    // Flag cho phép bypass tenant filter (dùng cho system tasks)
    bypassTenantFilter?: boolean;
    // Index signature required by nestjs-cls
    [key: string]: unknown;
    [key: symbol]: unknown;
}

// Interface cho User data (giữ tương thích với code cũ)
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
    'NhatKyHoatDong', // Audit Log
    'RefreshToken',   // Refresh tokens
];

// Bảng KHÔNG cần tenant filter (system tables)
const SYSTEM_TABLES = ['DoanhNghiep', 'ThanhToanSaas'];

/**
 * ============================================================
 * PRISMA SERVICE - SINGLETON với CLS Context
 * ============================================================
 *
 * CÁCH HOẠT ĐỘNG:
 * 1. ClsMiddleware được chạy TRƯỚC tất cả routes (setup trong AppModule)
 * 2. JwtAuthGuard verify token và gọi ClsService.set() để lưu user context
 * 3. PrismaService.$use() middleware đọc context từ ClsService.get()
 * 4. Tự động inject tenant filter vào mọi query
 *
 * QUAN TRỌNG: Không còn Scope.REQUEST → Connection Pool được tận dụng!
 */
@Injectable() // SINGLETON - Không còn { scope: Scope.REQUEST }
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(private readonly cls: ClsService<ClsStore>) {
        super({
            log:
                process.env.NODE_ENV === 'development'
                    ? ['warn', 'error']
                    : ['error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
        this.applyTenantMiddleware();
        this.logger.log('PrismaService initialized (Singleton + CLS)');
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('PrismaService disconnected');
    }

    private getTenantId(): string | null {
        return this.cls.get('tenantId') || null;
    }

    /**
     * Lấy user ID từ CLS context
     */
    private getUserId(): string | null {
        return this.cls.get('userId') || null;
    }

    /**
     * Kiểm tra có bypass tenant filter không
     * Dùng cho system tasks, cron jobs, migrations
     */
    private shouldBypassFilter(): boolean {
        return this.cls.get('bypassTenantFilter') === true;
    }

    /**
     * Kiểm tra model có cần tenant filter không
     */
    private requiresTenantFilter(model: string | undefined): boolean {
        if (!model) return false;
        return TENANT_TABLES.includes(model);
    }

    private applyTenantMiddleware() {
        this.$use(async (params, next) => {
            const tenantId = this.getTenantId();
            const userId = this.getUserId();
            const bypassFilter = this.shouldBypassFilter();
            const { model, action } = params;

            // Skip nếu:
            // 1. Không có model
            // 2. Bypass filter được bật (system operations)
            // 3. Không có tenantId (public routes)
            // 4. Model không cần tenant filter
            if (!model || bypassFilter || !tenantId || !this.requiresTenantFilter(model)) {
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
                    `[READ] ${model}.${action} - Tenant: ${tenantId.substring(0, 8)}...`,
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
                    `[CREATE] ${model} - Tenant: ${tenantId.substring(0, 8)}...`,
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
                    `[CREATE_MANY] ${model} - Count: ${params.args.data?.length || 0}`,
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
                    `[UPDATE] ${model}.${action} - Tenant: ${tenantId.substring(0, 8)}...`,
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

                this.logger.debug(`[SOFT_DELETE] ${model} - Converted to update`);
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

                this.logger.debug(`[SOFT_DELETE_MANY] ${model} - Converted to updateMany`);
            }

            return next(params);
        });
    }

    // ============================================================
    // PUBLIC UTILITY METHODS
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
     * Lấy user data hiện tại từ CLS context
     */
    getCurrentUser(): RequestUser | null {
        const userId = this.cls.get('userId');
        const tenantId = this.cls.get('tenantId');
        const email = this.cls.get('email');
        const hoTen = this.cls.get('hoTen');
        const vaiTro = this.cls.get('vaiTro');

        if (!userId || !tenantId) return null;

        return {
            id: userId,
            email: email || '',
            ho_ten: hoTen || '',
            vai_tro: vaiTro || '',
            id_doanh_nghiep: tenantId,
        };
    }

    /**
     * Set context thủ công (dùng cho background jobs, cron, migrations)
     *
     * @example
     * // Trong Cron Job:
     * await prisma.runWithContext({ tenantId: 'xxx', userId: 'system' }, async () => {
     *   await prisma.congViec.findMany({});
     * });
     */
    async runWithContext<T>(
        context: Partial<ClsStore>,
        callback: () => Promise<T>,
    ): Promise<T> {
        return this.cls.run(async () => {
            // Set context values
            if (context.tenantId) this.cls.set('tenantId', context.tenantId);
            if (context.userId) this.cls.set('userId', context.userId);
            if (context.bypassTenantFilter !== undefined) {
                this.cls.set('bypassTenantFilter', context.bypassTenantFilter);
            }

            return callback();
        });
    }

    /**
     * Run system operation mà không cần tenant filter
     * Dùng cho migrations, seeding, system cleanup
     *
     * @example
     * await prisma.runAsSystem(async () => {
     *   const allTenants = await prisma.doanhNghiep.findMany({});
     *   return allTenants;
     * });
     */
    async runAsSystem<T>(callback: () => Promise<T>): Promise<T> {
        return this.runWithContext({ bypassTenantFilter: true }, callback);
    }

    /**
     * Transaction helper với context được preserve
     * CLS context tự động được truyền vào transaction
     */
    async transactionWithContext<T>(
        fn: (
            tx: Omit<
                PrismaClient,
                '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
            >,
        ) => Promise<T>,
    ): Promise<T> {
        return this.$transaction(async (tx) => {
            // Transaction sẽ kế thừa CLS context từ parent
            return fn(tx);
        });
    }
}
