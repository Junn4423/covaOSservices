/**
 * ============================================================
 * CẤU HÌNH TEST - ServiceOS E2E Test Suite
 * ============================================================
 * 
 *  Cấu hình môi trường và constants cho test
 *  QUAN TRỌNG: Cấu hình timeout dài hơn cho các test phức tạp
 */

export const TestConfig = {
    // ============================================================
    // TIMEOUT CONFIGURATION
    // ============================================================
    //  CRITICAL: Các E2E flow dài và phức tạp
    // Cần timeout ít nhất 30 giây để tránh lỗi timeout
    JEST_TIMEOUT: 60000, // 60 giây
    API_TIMEOUT: 30000,  // 30 giây cho mỗi API call

    // ============================================================
    // BASE URL & SERVER
    // ============================================================
    BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    API_PREFIX: '/api/v1',

    // ============================================================
    // TEST TENANT DATA - Tenant A
    // ============================================================
    TENANT_A: {
        ten_doanh_nghiep: 'Công ty TNHH Test A',
        ma_doanh_nghiep: 'TEST_TENANT_A_' + Date.now(),
        email: 'admin.a@test-serviceos.vn',
        so_dien_thoai: '0901234567',
        dia_chi: '123 Nguyễn Văn Linh, Quận 7, TP.HCM',
    },

    // ============================================================
    // TEST TENANT DATA - Tenant B (Kiểm tra cô lập dữ liệu)
    // ============================================================
    TENANT_B: {
        ten_doanh_nghiep: 'Công ty TNHH Test B',
        ma_doanh_nghiep: 'TEST_TENANT_B_' + Date.now(),
        email: 'admin.b@test-serviceos.vn',
        so_dien_thoai: '0909876543',
        dia_chi: '456 Lê Lợi, Quận 1, TP.HCM',
    },

    // ============================================================
    // TEST ADMIN USER
    // ============================================================
    ADMIN_USER: {
        email: 'admin.test@serviceos.vn',
        mat_khau: 'SecurePass123!@#',
        ho_ten: 'Quản trị viên Test',
        vai_tro: 'admin',
    },

    // ============================================================
    // TEST STAFF USER (cho RBAC testing)
    // ============================================================
    STAFF_USER: {
        email: 'staff.test@serviceos.vn',
        mat_khau: 'StaffPass123!@#',
        ho_ten: 'Nhân viên Test',
        vai_tro: 'technician',
    },

    // ============================================================
    // DATABASE TABLES (theo thứ tự xóa an toàn)
    // ============================================================
    //  CRITICAL: Thứ tự quan trọng do Foreign Key
    DB_TABLES_CLEANUP_ORDER: [
        // Phase 1: Các bảng con (không FK đến bảng khác)
        'nhat_ky_hoat_dong',
        'refresh_token',
        'thong_bao',
        'danh_gia',
        'nghiem_thu_hinh_anh',
        'diem_dung',
        'nhat_ky_su_dung',
        
        // Phase 2: Các bảng trung gian
        'phan_cong',
        'cham_cong',
        'chi_tiet_bao_gia',
        'chi_tiet_don_dat_hang',
        'lich_su_kho',
        'ton_kho',
        
        // Phase 3: Các bảng chính level 2
        'phieu_thu_chi',
        'hop_dong',
        'bao_gia',
        'don_dat_hang_ncc',
        'lo_trinh',
        'cong_viec',
        'tai_san',
        
        // Phase 4: Các bảng chính level 1
        'san_pham',
        'nhom_san_pham',
        'kho',
        'ca_lam_viec',
        'nha_cung_cap',
        'tai_khoan_khach',
        'khach_hang',
        'thanh_toan_saas',
        
        // Phase 5: Core tables
        'nguoi_dung',
        'doanh_nghiep',
    ],

    // ============================================================
    // GRADING SYSTEM
    // ============================================================
    GRADES: {
        S: { min: 98, label: 'XUẤT SẮC (S-Rank)' },
        A: { min: 90, label: 'TỐT (A-Rank)' },
        B: { min: 75, label: 'KHÁ (B-Rank)' },
        C: { min: 60, label: 'TRUNG BÌNH (C-Rank)' },
        F: { min: 0, label: 'KHÔNG ĐẠT (F-Rank)' },
    },
};

export const GRADES = TestConfig.GRADES;
export default TestConfig;
