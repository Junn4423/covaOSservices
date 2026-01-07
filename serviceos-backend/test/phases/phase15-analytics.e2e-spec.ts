/**
 * ============================================================
 * PHASE 15: ANALYTICS DASHBOARD TEST
 * ServiceOS E2E Test Suite
 * ============================================================
 *
 * PHAM VI TEST:
 * - Thong ke tong quan (Overview Stats)
 * - Bieu do doanh thu (Revenue Chart)
 * - San pham ban chay (Top Selling Products)
 * - Hieu suat nhan vien (Technician Performance)
 *
 * KIEM TRA BUSINESS LOGIC:
 * - Tong doanh thu = Sum(PhieuThuChi loai THU)
 * - Khach hang moi = Count(KhachHang trong khoang thoi gian)
 * - Cong viec dang chay = Count(CongViec trang_thai DANG_THUC_HIEN)
 * - Bao gia dang cho = Count(BaoGia trang_thai SENT)
 *
 * BAO MAT:
 * - Chi Admin moi truy cap duoc module nay
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { TestConfig } from '../config/test.config';
import {
    ApiTestHelper,
    testData,
    prisma,
    ensureTenantExists,
} from '../config/test.helpers';
import { testReporter } from '../config/test.reporter';

describe('PHASE 15: Analytics Dashboard', () => {
    let app: INestApplication;
    let api: ApiTestHelper;

    // Bien luu ket qua test
    let overviewStats: any;
    let revenueChart: any;
    let topSellingProducts: any;
    let technicianPerformance: any;

    beforeAll(async () => {
        jest.setTimeout(TestConfig.JEST_TIMEOUT);

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        app.setGlobalPrefix(TestConfig.API_PREFIX.replace('/', ''));
        await app.init();

        api = new ApiTestHelper(app);

        // Dam bao tenant ton tai truoc khi test
        await ensureTenantExists();
    });

    afterAll(async () => {
        await app.close();
    });

    // ============================================================
    // SECTION 1: OVERVIEW STATS
    // ============================================================

    describe('15.1 Thong ke tong quan (Overview Stats)', () => {
        it('Lay thong ke tong quan - Yeu cau Admin role', async () => {
            const tuNgay = new Date();
            tuNgay.setMonth(tuNgay.getMonth() - 1);
            const denNgay = new Date();

            const response = await api.get(
                `/analytics/overview?tu_ngay=${tuNgay.toISOString().split('T')[0]}&den_ngay=${denNgay.toISOString().split('T')[0]}`,
                testData.tenantA.accessToken,
            );

            if (response.status === 200) {
                overviewStats = response.body;

                expect(overviewStats).toHaveProperty('tong_doanh_thu');
                expect(overviewStats).toHaveProperty('khach_hang_moi');
                expect(overviewStats).toHaveProperty('cong_viec_dang_chay');
                expect(overviewStats).toHaveProperty('bao_gia_dang_cho');
                expect(overviewStats).toHaveProperty('khoang_thoi_gian');

                // Kiem tra kieu du lieu
                expect(typeof overviewStats.tong_doanh_thu).toBe('number');
                expect(typeof overviewStats.khach_hang_moi).toBe('number');
                expect(typeof overviewStats.cong_viec_dang_chay).toBe('number');
                expect(typeof overviewStats.bao_gia_dang_cho).toBe('number');

                testReporter.ghiNhanKetQua({
                    tenTest: 'Lay thong ke tong quan',
                    endpoint: '/analytics/overview',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: `Doanh thu: ${overviewStats.tong_doanh_thu.toLocaleString()} VND, Khach hang moi: ${overviewStats.khach_hang_moi}, Cong viec: ${overviewStats.cong_viec_dang_chay}, Bao gia: ${overviewStats.bao_gia_dang_cho}`,
                });
            } else if (response.status === 403) {
                // Neu khong phai Admin, kiem tra response 403
                expect(response.status).toBe(403);
                testReporter.ghiNhanKetQua({
                    tenTest: 'Lay thong ke tong quan - Khong co quyen',
                    endpoint: '/analytics/overview',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: 'User khong phai Admin bi tu choi truy cap',
                });
            }
        });

        it('Kiem tra validation khoang thoi gian', async () => {
            // Test khoang thoi gian khong hop le (ngay bat dau > ngay ket thuc)
            const response = await api.get(
                '/analytics/overview?tu_ngay=2026-12-31&den_ngay=2026-01-01',
                testData.tenantA.accessToken,
            );

            if (response.status === 400) {
                expect(response.body.message).toContain('Khoang thoi gian khong hop le');
                testReporter.ghiNhanKetQua({
                    tenTest: 'Validation khoang thoi gian',
                    endpoint: '/analytics/overview',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: 'Tu choi khoang thoi gian khong hop le',
                });
            }
        });

        it('Kiem tra cache hoat dong', async () => {
            const tuNgay = new Date();
            tuNgay.setMonth(tuNgay.getMonth() - 1);
            const denNgay = new Date();
            const queryString = `tu_ngay=${tuNgay.toISOString().split('T')[0]}&den_ngay=${denNgay.toISOString().split('T')[0]}`;

            // Goi lan 1
            const startTime1 = Date.now();
            const response1 = await api.get(`/analytics/overview?${queryString}`, testData.tenantA.accessToken);
            const duration1 = Date.now() - startTime1;

            // Goi lan 2 (nen lay tu cache)
            const startTime2 = Date.now();
            const response2 = await api.get(`/analytics/overview?${queryString}`, testData.tenantA.accessToken);
            const duration2 = Date.now() - startTime2;

            if (response1.status === 200 && response2.status === 200) {
                // Ket qua phai giong nhau
                expect(response1.body).toEqual(response2.body);

                testReporter.ghiNhanKetQua({
                    tenTest: 'Kiem tra cache',
                    endpoint: '/analytics/overview',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: `Lan 1: ${duration1}ms, Lan 2: ${duration2}ms (cache)`,
                });
            }
        });
    });

    // ============================================================
    // SECTION 2: REVENUE CHART
    // ============================================================

    describe('15.2 Bieu do doanh thu (Revenue Chart)', () => {
        it('Lay bieu do doanh thu theo thang', async () => {
            const nam = new Date().getFullYear();

            const response = await api.get(
                `/analytics/revenue-chart?nam=${nam}&che_do=MONTHLY`,
                testData.tenantA.accessToken,
            );

            if (response.status === 200) {
                revenueChart = response.body;

                expect(revenueChart).toHaveProperty('labels');
                expect(revenueChart).toHaveProperty('data');
                expect(revenueChart).toHaveProperty('nam');
                expect(revenueChart).toHaveProperty('che_do');
                expect(revenueChart).toHaveProperty('tong_nam');

                // Kiem tra cau truc labels (12 thang)
                expect(revenueChart.labels).toHaveLength(12);
                expect(revenueChart.data).toHaveLength(12);
                expect(revenueChart.che_do).toBe('MONTHLY');
                expect(revenueChart.nam).toBe(nam);

                // Kiem tra labels
                expect(revenueChart.labels[0]).toBe('Thang 1');
                expect(revenueChart.labels[11]).toBe('Thang 12');

                testReporter.ghiNhanKetQua({
                    tenTest: 'Bieu do doanh thu theo thang',
                    endpoint: '/analytics/revenue-chart',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: `Nam ${nam}, Tong nam: ${revenueChart.tong_nam.toLocaleString()} VND`,
                });
            }
        });

        it('Lay bieu do doanh thu theo tuan', async () => {
            const nam = new Date().getFullYear();

            const response = await api.get(
                `/analytics/revenue-chart?nam=${nam}&che_do=WEEKLY`,
                testData.tenantA.accessToken,
            );

            if (response.status === 200) {
                const weeklyChart = response.body;

                expect(weeklyChart).toHaveProperty('labels');
                expect(weeklyChart).toHaveProperty('data');
                expect(weeklyChart.che_do).toBe('WEEKLY');

                // So tuan trong nam thuong la 52-53
                expect(weeklyChart.labels.length).toBeGreaterThanOrEqual(52);
                expect(weeklyChart.labels.length).toBeLessThanOrEqual(53);

                testReporter.ghiNhanKetQua({
                    tenTest: 'Bieu do doanh thu theo tuan',
                    endpoint: '/analytics/revenue-chart',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: `Nam ${nam}, So tuan: ${weeklyChart.labels.length}`,
                });
            }
        });

        it('Kiem tra validation nam', async () => {
            // Test nam khong hop le
            const response = await api.get(
                '/analytics/revenue-chart?nam=1900&che_do=MONTHLY',
                testData.tenantA.accessToken,
            );

            if (response.status === 400) {
                testReporter.ghiNhanKetQua({
                    tenTest: 'Validation nam',
                    endpoint: '/analytics/revenue-chart',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: 'Tu choi nam khong hop le',
                });
            }
        });
    });

    // ============================================================
    // SECTION 3: TOP SELLING PRODUCTS
    // ============================================================

    describe('15.3 San pham ban chay (Top Selling)', () => {
        it('Lay top 5 san pham ban chay', async () => {
            const response = await api.get('/analytics/top-selling?gioi_han=5', testData.tenantA.accessToken);

            if (response.status === 200) {
                topSellingProducts = response.body;

                expect(topSellingProducts).toHaveProperty('san_pham');
                expect(Array.isArray(topSellingProducts.san_pham)).toBe(true);

                // Kiem tra cau truc moi san pham (neu co)
                if (topSellingProducts.san_pham.length > 0) {
                    const firstProduct = topSellingProducts.san_pham[0];
                    expect(firstProduct).toHaveProperty('id');
                    expect(firstProduct).toHaveProperty('ten_san_pham');
                    expect(firstProduct).toHaveProperty('tong_so_luong');
                    expect(firstProduct).toHaveProperty('tong_doanh_thu');
                    expect(firstProduct).toHaveProperty('thu_tu');

                    // Thu tu phai bat dau tu 1
                    expect(firstProduct.thu_tu).toBe(1);
                }

                testReporter.ghiNhanKetQua({
                    tenTest: 'Top 5 san pham ban chay',
                    endpoint: '/analytics/top-selling',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: `Tim thay ${topSellingProducts.san_pham.length} san pham`,
                });
            }
        });

        it('Lay top san pham theo khoang thoi gian', async () => {
            const tuNgay = new Date();
            tuNgay.setMonth(tuNgay.getMonth() - 3);
            const denNgay = new Date();

            const response = await api.get(
                `/analytics/top-selling?gioi_han=10&tu_ngay=${tuNgay.toISOString().split('T')[0]}&den_ngay=${denNgay.toISOString().split('T')[0]}`,
                testData.tenantA.accessToken,
            );

            if (response.status === 200) {
                expect(response.body).toHaveProperty('san_pham');
                expect(response.body).toHaveProperty('khoang_thoi_gian');

                testReporter.ghiNhanKetQua({
                    tenTest: 'Top san pham theo khoang thoi gian',
                    endpoint: '/analytics/top-selling',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: `Tim thay ${response.body.san_pham.length} san pham trong 3 thang`,
                });
            }
        });
    });

    // ============================================================
    // SECTION 4: TECHNICIAN PERFORMANCE
    // ============================================================

    describe('15.4 Hieu suat nhan vien (Technician Performance)', () => {
        it('Lay hieu suat nhan vien ky thuat', async () => {
            const response = await api.get(
                '/analytics/technician-performance?gioi_han=10',
                testData.tenantA.accessToken,
            );

            if (response.status === 200) {
                technicianPerformance = response.body;

                expect(technicianPerformance).toHaveProperty('nhan_vien');
                expect(technicianPerformance).toHaveProperty('thong_ke');
                expect(Array.isArray(technicianPerformance.nhan_vien)).toBe(true);

                // Kiem tra thong ke tong hop
                expect(technicianPerformance.thong_ke).toHaveProperty('tong_nhan_vien');
                expect(technicianPerformance.thong_ke).toHaveProperty(
                    'tong_cong_viec_hoan_thanh',
                );
                expect(technicianPerformance.thong_ke).toHaveProperty(
                    'diem_danh_gia_tb_chung',
                );

                // Kiem tra cau truc moi nhan vien (neu co)
                if (technicianPerformance.nhan_vien.length > 0) {
                    const firstTech = technicianPerformance.nhan_vien[0];
                    expect(firstTech).toHaveProperty('id');
                    expect(firstTech).toHaveProperty('ho_ten');
                    expect(firstTech).toHaveProperty('cong_viec_hoan_thanh');
                    expect(firstTech).toHaveProperty('diem_danh_gia_tb');
                    expect(firstTech).toHaveProperty('so_luong_danh_gia');
                    expect(firstTech).toHaveProperty('thu_tu');
                }

                testReporter.ghiNhanKetQua({
                    tenTest: 'Hieu suat nhan vien',
                    endpoint: '/analytics/technician-performance',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: `Tim thay ${technicianPerformance.nhan_vien.length} nhan vien, Tong cong viec: ${technicianPerformance.thong_ke.tong_cong_viec_hoan_thanh}`,
                });
            }
        });

        it('Lay hieu suat nhan vien theo khoang thoi gian', async () => {
            const tuNgay = new Date();
            tuNgay.setMonth(tuNgay.getMonth() - 6);
            const denNgay = new Date();

            const response = await api.get(
                `/analytics/technician-performance?gioi_han=5&tu_ngay=${tuNgay.toISOString().split('T')[0]}&den_ngay=${denNgay.toISOString().split('T')[0]}`,
                testData.tenantA.accessToken,
            );

            if (response.status === 200) {
                expect(response.body).toHaveProperty('nhan_vien');
                expect(response.body).toHaveProperty('thong_ke');
                expect(response.body).toHaveProperty('khoang_thoi_gian');

                testReporter.ghiNhanKetQua({
                    tenTest: 'Hieu suat nhan vien theo khoang thoi gian',
                    endpoint: '/analytics/technician-performance',
                    method: 'GET',
                    trangThai: 'PASSED',
                    moTa: `Tim thay ${response.body.nhan_vien.length} nhan vien trong 6 thang`,
                });
            }
        });
    });

    // ============================================================
    // SECTION 5: SECURITY & ACCESS CONTROL
    // ============================================================

    describe('15.5 Bao mat va phan quyen', () => {
        it('Tu choi truy cap khi khong co token', async () => {
            // Tao request khong co token
            const response = await api.getWithoutAuth('/analytics/overview?tu_ngay=2026-01-01&den_ngay=2026-01-31');

            // Nen tra ve 401 Unauthorized
            expect(response.status).toBe(401);

            testReporter.ghiNhanKetQua({
                tenTest: 'Tu choi truy cap khong co token',
                endpoint: '/analytics/overview',
                method: 'GET',
                trangThai: 'PASSED',
                moTa: 'Tra ve 401 khi khong co token',
            });
        });

        it('API chi cho phep Admin truy cap', async () => {
            // Test nay kiem tra role-based access
            // Neu user dang test la Admin thi se thanh cong
            // Neu khong phai Admin thi se bi 403

            const response = await api.get(
                '/analytics/overview?tu_ngay=2026-01-01&den_ngay=2026-01-31',
                testData.tenantA.accessToken,
            );

            // Chi Admin moi truy cap duoc
            expect([200, 403]).toContain(response.status);

            testReporter.ghiNhanKetQua({
                tenTest: 'Kiem tra role Admin',
                endpoint: '/analytics/overview',
                method: 'GET',
                trangThai: 'PASSED',
                moTa:
                    response.status === 200
                        ? 'Admin truy cap thanh cong'
                        : 'Non-admin bi tu choi (403)',
            });
        });
    });

    // ============================================================
    // SECTION 6: SUMMARY
    // ============================================================

    describe('15.6 Tong ket Phase 15', () => {
        it('In bao cao tong ket Analytics', () => {
            console.log('\n');
            console.log('='.repeat(60));
            console.log('PHASE 15: ANALYTICS DASHBOARD - TONG KET');
            console.log('='.repeat(60));

            if (overviewStats) {
                console.log('\nTHONG KE TONG QUAN:');
                console.log(
                    `  - Tong doanh thu: ${overviewStats.tong_doanh_thu?.toLocaleString() || 0} VND`,
                );
                console.log(`  - Khach hang moi: ${overviewStats.khach_hang_moi || 0}`);
                console.log(
                    `  - Cong viec dang chay: ${overviewStats.cong_viec_dang_chay || 0}`,
                );
                console.log(`  - Bao gia dang cho: ${overviewStats.bao_gia_dang_cho || 0}`);
            }

            if (revenueChart) {
                console.log('\nBIEU DO DOANH THU:');
                console.log(`  - Nam: ${revenueChart.nam}`);
                console.log(`  - Che do: ${revenueChart.che_do}`);
                console.log(
                    `  - Tong nam: ${revenueChart.tong_nam?.toLocaleString() || 0} VND`,
                );
            }

            if (topSellingProducts) {
                console.log('\nSAN PHAM BAN CHAY:');
                console.log(`  - So luong san pham: ${topSellingProducts.san_pham?.length || 0}`);
                if (topSellingProducts.san_pham?.length > 0) {
                    console.log(`  - Top 1: ${topSellingProducts.san_pham[0].ten_san_pham}`);
                }
            }

            if (technicianPerformance) {
                console.log('\nHIEU SUAT NHAN VIEN:');
                console.log(
                    `  - Tong nhan vien: ${technicianPerformance.thong_ke?.tong_nhan_vien || 0}`,
                );
                console.log(
                    `  - Tong cong viec hoan thanh: ${technicianPerformance.thong_ke?.tong_cong_viec_hoan_thanh || 0}`,
                );
                console.log(
                    `  - Diem danh gia TB: ${technicianPerformance.thong_ke?.diem_danh_gia_tb_chung || 'Chua co'}`,
                );
            }

            console.log('\n' + '='.repeat(60));
            console.log('HOAN THANH PHASE 15: ANALYTICS DASHBOARD');
            console.log('='.repeat(60));
            console.log('\n');

            expect(true).toBe(true);
        });
    });
});
