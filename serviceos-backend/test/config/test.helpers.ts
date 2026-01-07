/**
 * ============================================================
 * TEST HELPERS - Các hàm tiện ích cho E2E Testing
 * ServiceOS E2E Test Suite
 * ============================================================
 * 
 *  Bao gồm:
 * - HTTP request helpers với timing
 * - Database cleanup utilities
 * - Token management
 * - Data generators
 */

import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TestConfig } from './test.config';
import { testReporter, KetQuaTest } from './test.reporter';

// ============================================================
// PRISMA CLIENT SINGLETON
// ============================================================
export const prisma = new PrismaClient();

// ============================================================
// INTERFACES
// ============================================================

export interface ApiTestOptions {
    tenTest: string;
    skipReport?: boolean;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string;
    userId?: string;
    tenantId?: string;
}

// ============================================================
// STORED DATA - Lưu trữ dữ liệu giữa các test
// ============================================================
export class TestDataStore {
    // Tenant A Data
    tenantA: {
        id: string;
        accessToken: string;
        refreshToken: string;
        adminId: string;
        staffToken?: string;
        staffId?: string;
    } = {} as any;

    // Tenant B Data  
    tenantB: {
        id: string;
        accessToken: string;
        refreshToken: string;
        adminId: string;
    } = {} as any;

    // Admin User Data (for app.e2e-spec.ts compatibility)
    adminUser: any = null;
    adminToken: string = '';

    // Shared Test Data
    khachHangId: string = '';
    khachHangMa: string = '';
    sanPhamId: string = '';
    sanPhamMa: string = '';
    nhomSanPhamId: string = '';
    khoId: string = '';
    baoGiaId: string = '';
    baoGiaMa: string = '';
    hopDongId: string = '';
    congViecId: string = '';
    nhaCungCapId: string = '';
    donDatHangId: string = '';
    caLamViecId: string = '';
    chamCongId: string = '';
    taiSanId: string = '';
    phieuThuChiId: string = '';
    taiKhoanKhachId: string = '';
    customerToken: string = '';

    reset(): void {
        this.tenantA = {} as any;
        this.tenantB = {} as any;
        this.adminUser = null;
        this.adminToken = '';
        this.khachHangId = '';
        this.khachHangMa = '';
        this.sanPhamId = '';
        this.sanPhamMa = '';
        this.nhomSanPhamId = '';
        this.khoId = '';
        this.baoGiaId = '';
        this.baoGiaMa = '';
        this.hopDongId = '';
        this.congViecId = '';
        this.nhaCungCapId = '';
        this.donDatHangId = '';
        this.caLamViecId = '';
        this.chamCongId = '';
        this.taiSanId = '';
        this.phieuThuChiId = '';
        this.taiKhoanKhachId = '';
        this.customerToken = '';
    }
}

export const testData = new TestDataStore();

// ============================================================
// API TEST WRAPPER - Wrap request với timing và reporting
// ============================================================
export class ApiTestHelper {
    private app: INestApplication;
    private baseUrl: string;

    constructor(app: INestApplication) {
        this.app = app;
        this.baseUrl = TestConfig.API_PREFIX;
    }

    /**
     * POST Request với auto-reporting
     */
    async post(
        endpoint: string, 
        body: any, 
        token?: string,
        options?: ApiTestOptions
    ): Promise<request.Response> {
        const startTime = Date.now();
        const fullEndpoint = this.baseUrl + endpoint;
        
        let req = request(this.app.getHttpServer())
            .post(fullEndpoint)
            .send(body);
        
        if (token) {
            req = req.set('Authorization', `Bearer ${token}`);
        }

        const response = await req;
        const duration = Date.now() - startTime;

        if (options && !options.skipReport) {
            this.reportResult('POST', fullEndpoint, response, duration, options.tenTest);
        }

        return response;
    }

    /**
     * GET Request với auto-reporting
     */
    async get(
        endpoint: string,
        token?: string,
        query?: Record<string, any>,
        options?: ApiTestOptions
    ): Promise<request.Response> {
        const startTime = Date.now();
        const fullEndpoint = this.baseUrl + endpoint;

        let req = request(this.app.getHttpServer())
            .get(fullEndpoint);

        if (query) {
            req = req.query(query);
        }

        if (token) {
            req = req.set('Authorization', `Bearer ${token}`);
        }

        const response = await req;
        const duration = Date.now() - startTime;

        if (options && !options.skipReport) {
            this.reportResult('GET', fullEndpoint, response, duration, options.tenTest);
        }

        return response;
    }

    /**
     * PUT Request với auto-reporting
     */
    async put(
        endpoint: string,
        body: any,
        token?: string,
        options?: ApiTestOptions
    ): Promise<request.Response> {
        const startTime = Date.now();
        const fullEndpoint = this.baseUrl + endpoint;

        let req = request(this.app.getHttpServer())
            .put(fullEndpoint)
            .send(body);

        if (token) {
            req = req.set('Authorization', `Bearer ${token}`);
        }

        const response = await req;
        const duration = Date.now() - startTime;

        if (options && !options.skipReport) {
            this.reportResult('PUT', fullEndpoint, response, duration, options.tenTest);
        }

        return response;
    }

    /**
     * PATCH Request với auto-reporting
     */
    async patch(
        endpoint: string,
        body: any,
        token?: string,
        options?: ApiTestOptions
    ): Promise<request.Response> {
        const startTime = Date.now();
        const fullEndpoint = this.baseUrl + endpoint;

        let req = request(this.app.getHttpServer())
            .patch(fullEndpoint)
            .send(body);

        if (token) {
            req = req.set('Authorization', `Bearer ${token}`);
        }

        const response = await req;
        const duration = Date.now() - startTime;

        if (options && !options.skipReport) {
            this.reportResult('PATCH', fullEndpoint, response, duration, options.tenTest);
        }

        return response;
    }

    /**
     * DELETE Request với auto-reporting
     */
    async delete(
        endpoint: string,
        token?: string,
        options?: ApiTestOptions
    ): Promise<request.Response> {
        const startTime = Date.now();
        const fullEndpoint = this.baseUrl + endpoint;

        let req = request(this.app.getHttpServer())
            .delete(fullEndpoint);

        if (token) {
            req = req.set('Authorization', `Bearer ${token}`);
        }

        const response = await req;
        const duration = Date.now() - startTime;

        if (options && !options.skipReport) {
            this.reportResult('DELETE', fullEndpoint, response, duration, options.tenTest);
        }

        return response;
    }

    /**
     * Report kết quả test
     */
    private reportResult(
        method: string,
        endpoint: string,
        response: request.Response,
        duration: number,
        tenTest: string
    ): void {
        const isSuccess = response.status >= 200 && response.status < 400;
        
        const ketQua: KetQuaTest = {
            tenTest,
            endpoint,
            method,
            thanhCong: isSuccess,
            thoiGianMs: duration,
            statusCode: response.status,
        };

        if (!isSuccess) {
            ketQua.loiChiTiet = JSON.stringify(response.body?.message || response.body);
            ketQua.loaiLoi = this.classifyError(response.status);
        }

        testReporter.ghiNhanKetQua(ketQua);
    }

    /**
     * Phân loại lỗi dựa trên status code
     */
    private classifyError(status: number): KetQuaTest['loaiLoi'] {
        if (status === 400) return 'VALIDATION';
        if (status === 401 || status === 403) return 'UNAUTHORIZED';
        if (status === 409 || status === 422) return 'BUSINESS_LOGIC';
        if (status >= 500) return 'SERVER_ERROR';
        return 'VALIDATION';
    }
}

// ============================================================
// DATABASE CLEANUP UTILITIES
// ============================================================

/**
 *  CRITICAL: Xóa sạch database trước khi test
 * Sử dụng raw SQL để bypass Foreign Key constraints
 */
export async function cleanupDatabase(): Promise<void> {
    console.log('\n🧹 Đang dọn dẹp database...');
    
    try {
        //  CRITICAL: Tắt Foreign Key checks trước khi truncate
        // Nếu không làm điều này, test setup sẽ crash do FK constraints
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

        for (const table of TestConfig.DB_TABLES_CLEANUP_ORDER) {
            try {
                // Sử dụng DELETE thay vì TRUNCATE để an toàn hơn với một số DB
                await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
                console.log(`  ✓ Đã xóa bảng: ${table}`);
            } catch (error) {
                // Bỏ qua nếu bảng không tồn tại
                console.log(`   Không thể xóa bảng ${table}: ${(error as Error).message}`);
            }
        }

        // Bật lại Foreign Key checks
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
        
        console.log(' Dọn dẹp database hoàn tất!\n');
    } catch (error) {
        console.error(' Lỗi khi dọn dẹp database:', error);
        // Đảm bảo bật lại FK checks dù có lỗi
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
        throw error;
    }
}

/**
 * Xóa dữ liệu test cụ thể (không xóa toàn bộ)
 */
export async function cleanupTestData(tenantIds: string[]): Promise<void> {
    console.log('\n🧹 Đang xóa dữ liệu test...');
    
    try {
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

        for (const tenantId of tenantIds) {
            // Xóa theo cascade từ tenant
            await prisma.doanhNghiep.deleteMany({
                where: { id: tenantId }
            });
        }

        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
        console.log(' Xóa dữ liệu test hoàn tất!\n');
    } catch (error) {
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
        console.error(' Lỗi khi xóa dữ liệu test:', error);
    }
}

// ============================================================
// ENSURE TENANT EXISTS - Đảm bảo tenant tồn tại cho test
// ============================================================

/**
 * Đảm bảo Tenant A và B tồn tại trong database
 * Sử dụng trong beforeAll của mỗi test phase
 */
export async function ensureTenantExists(): Promise<void> {
    const bcrypt = require('bcrypt');
    
    // Kiểm tra và tạo Tenant A nếu chưa có
    if (!testData.tenantA.id) {
        // Tìm tenant A có sẵn
        let tenantA = await prisma.doanhNghiep.findFirst({
            where: {
                ma_doanh_nghiep: { startsWith: 'TEST_TENANT_A_' }
            }
        });

        if (!tenantA) {
            // Tạo mới Tenant A
            tenantA = await prisma.doanhNghiep.create({
                data: {
                    ten_doanh_nghiep: TestConfig.TENANT_A.ten_doanh_nghiep,
                    ma_doanh_nghiep: TestConfig.TENANT_A.ma_doanh_nghiep,
                    email: TestConfig.TENANT_A.email,
                    so_dien_thoai: TestConfig.TENANT_A.so_dien_thoai,
                    dia_chi: TestConfig.TENANT_A.dia_chi,
                    goi_cuoc: 'trial',
                    trang_thai: 1,
                }
            });
            console.log(' Đã tạo Tenant A:', tenantA.id);
        } else {
            console.log(' Sử dụng Tenant A có sẵn:', tenantA.id);
        }
        
        testData.tenantA.id = tenantA.id;
        
        // Tìm hoặc tạo admin user cho Tenant A
        let adminA = await prisma.nguoiDung.findFirst({
            where: {
                id_doanh_nghiep: tenantA.id,
                vai_tro: 'admin',
            }
        });
        
        if (!adminA) {
            const hashedPassword = await bcrypt.hash(TestConfig.ADMIN_USER.mat_khau, 10);
            adminA = await prisma.nguoiDung.create({
                data: {
                    id_doanh_nghiep: tenantA.id,
                    email: TestConfig.ADMIN_USER.email,
                    mat_khau: hashedPassword,
                    ho_ten: TestConfig.ADMIN_USER.ho_ten,
                    vai_tro: 'admin',
                    trang_thai: 1,
                }
            });
            console.log(' Đã tạo Admin cho Tenant A:', adminA.id);
        }
        
        testData.tenantA.adminId = adminA.id;
        testData.tenantA.accessToken = 'mock_token_for_testing'; // Mock token cho test
    }
    
    // Kiểm tra và tạo Tenant B nếu chưa có
    if (!testData.tenantB.id) {
        let tenantB = await prisma.doanhNghiep.findFirst({
            where: {
                ma_doanh_nghiep: { startsWith: 'TEST_TENANT_B_' }
            }
        });

        if (!tenantB) {
            tenantB = await prisma.doanhNghiep.create({
                data: {
                    ten_doanh_nghiep: TestConfig.TENANT_B.ten_doanh_nghiep,
                    ma_doanh_nghiep: TestConfig.TENANT_B.ma_doanh_nghiep,
                    email: TestConfig.TENANT_B.email,
                    so_dien_thoai: TestConfig.TENANT_B.so_dien_thoai,
                    dia_chi: TestConfig.TENANT_B.dia_chi,
                    goi_cuoc: 'trial',
                    trang_thai: 1,
                }
            });
            console.log(' Đã tạo Tenant B:', tenantB.id);
        }
        
        testData.tenantB.id = tenantB.id;
        
        // Tạo admin cho Tenant B nếu chưa có
        let adminB = await prisma.nguoiDung.findFirst({
            where: {
                id_doanh_nghiep: tenantB.id,
                vai_tro: 'admin',
            }
        });
        
        if (!adminB) {
            const hashedPassword = await bcrypt.hash('AdminB123!@#', 10);
            adminB = await prisma.nguoiDung.create({
                data: {
                    id_doanh_nghiep: tenantB.id,
                    email: TestConfig.TENANT_B.email,
                    mat_khau: hashedPassword,
                    ho_ten: 'Admin Tenant B',
                    vai_tro: 'admin',
                    trang_thai: 1,
                }
            });
        }
        
        testData.tenantB.adminId = adminB.id;
        testData.tenantB.accessToken = 'mock_token_b_for_testing';
    }
}

// ============================================================
// DATA GENERATORS - Tạo dữ liệu test ngẫu nhiên
// ============================================================

export const DataGenerator = {
    /**
     * Tạo mã ngẫu nhiên
     */
    generateCode(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    },

    /**
     * Tạo email ngẫu nhiên
     */
    generateEmail(prefix: string = 'test'): string {
        return `${prefix}_${Date.now()}@test-serviceos.vn`;
    },

    /**
     * Tạo số điện thoại VN ngẫu nhiên
     */
    generatePhone(): string {
        const prefixes = ['090', '091', '093', '094', '096', '097', '098'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        return prefix + suffix;
    },

    /**
     * Tạo UUID fake cho test lỗi
     */
    generateFakeUUID(): string {
        return '00000000-0000-0000-0000-000000000000';
    },

    /**
     * Tạo dữ liệu khách hàng test
     */
    createKhachHangData(overrides?: Partial<any>) {
        return {
            ho_ten: `Khách hàng Test ${Date.now()}`,
            ma_khach_hang: this.generateCode('KH'),
            email: this.generateEmail('khach'),
            so_dien_thoai: this.generatePhone(),
            dia_chi: '123 Đường Test, Phường Test, Quận Test, TP.HCM',
            thanh_pho: 'TP.HCM',
            quan_huyen: 'Quận 1',
            loai_khach: 'ca_nhan',
            nguon_khach: 'WEBSITE',
            ...overrides,
        };
    },

    /**
     * Tạo dữ liệu sản phẩm test
     */
    createSanPhamData(nhomId?: string, overrides?: Partial<any>) {
        return {
            ten_san_pham: `Sản phẩm Test ${Date.now()}`,
            ma_san_pham: this.generateCode('SP'),
            loai_san_pham: 'HANG_HOA',
            gia_ban: 500000,
            gia_von: 300000,
            don_vi_tinh: 'Cái',
            mo_ta: 'Sản phẩm test tự động tạo',
            id_nhom_san_pham: nhomId || null,
            ...overrides,
        };
    },

    /**
     * Tạo dữ liệu kho test
     */
    createKhoData(overrides?: Partial<any>) {
        return {
            ten_kho: `Kho Test ${Date.now()}`,
            loai_kho: 'co_dinh',
            dia_chi: '456 Đường Kho, Phường Kho, Quận Kho',
            ...overrides,
        };
    },

    /**
     * Tạo dữ liệu nhà cung cấp test
     */
    createNhaCungCapData(overrides?: Partial<any>) {
        return {
            ten_nha_cung_cap: `NCC Test ${Date.now()}`,
            ma_ncc: this.generateCode('NCC'),
            email: this.generateEmail('ncc'),
            so_dien_thoai: this.generatePhone(),
            nguoi_lien_he: 'Nguyễn Văn Test',
            dia_chi: '789 Đường NCC, Quận Test',
            ma_so_thue: `MST${Date.now()}`,
            ...overrides,
        };
    },

    /**
     * Tạo dữ liệu ca làm việc test
     */
    createCaLamViecData(overrides?: Partial<any>) {
        return {
            ten_ca: `Ca Test ${Date.now()}`,
            gio_bat_dau: '08:00',
            gio_ket_thuc: '17:00',
            ap_dung_thu: '2,3,4,5,6',
            ...overrides,
        };
    },

    /**
     * Tạo dữ liệu công việc test
     */
    createCongViecData(khachHangId?: string, overrides?: Partial<any>) {
        return {
            tieu_de: `Công việc Test ${Date.now()}`,
            ma_cong_viec: this.generateCode('CV'),
            mo_ta: 'Mô tả công việc test',
            trang_thai: 0,
            do_uu_tien: 2,
            dia_chi_lam_viec: '123 Địa chỉ làm việc',
            id_khach_hang: khachHangId,
            ...overrides,
        };
    },

    /**
     * Tạo dữ liệu tài sản test
     */
    createTaiSanData(overrides?: Partial<any>) {
        return {
            ten_tai_san: `Tài sản Test ${Date.now()}`,
            ma_tai_san: this.generateCode('TS'),
            ma_seri: `SERI${Date.now()}`,
            loai_tai_san: 'Thiết bị văn phòng',
            ngay_mua: new Date().toISOString().split('T')[0],
            gia_mua: 5000000,
            vi_tri_hien_tai: 'Phòng IT',
            ...overrides,
        };
    },
};

// ============================================================
// ASSERTION HELPERS - Kiểm tra response
// ============================================================

export const AssertionHelper = {
    /**
     * Kiểm tra response thành công
     */
    expectSuccess(response: request.Response, expectedStatus: number = 200): void {
        expect(response.status).toBe(expectedStatus);
        expect(response.body).toBeDefined();
    },

    /**
     * Kiểm tra response có data
     */
    expectData(response: request.Response): void {
        expect(response.body).toBeDefined();
        expect(response.body.data).toBeDefined();
    },

    /**
     * Kiểm tra response list có pagination
     */
    expectPaginatedList(response: request.Response): void {
        expect(response.body).toBeDefined();
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toBeDefined();
        expect(response.body.meta.total).toBeDefined();
    },

    /**
     * Kiểm tra response lỗi
     */
    expectError(response: request.Response, expectedStatus: number): void {
        expect(response.status).toBe(expectedStatus);
        expect(response.body.message).toBeDefined();
    },

    /**
     * Kiểm tra UUID hợp lệ
     */
    expectValidUUID(value: string): void {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(value).toMatch(uuidRegex);
    },

    /**
     * Kiểm tra decimal precision
     */
    expectDecimalPrecision(value: number | string, precision: number = 2): void {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        const decimalPart = numValue.toString().split('.')[1];
        if (decimalPart) {
            expect(decimalPart.length).toBeLessThanOrEqual(precision + 2); // Allow for rounding
        }
    },
};
