SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- PHẦN 1: LÕI HỆ THỐNG (CORE)
-- ============================================================

-- Bảng DOANH NGHIỆP (Tenant chính)
CREATE TABLE `doanh_nghiep` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `ten_doanh_nghiep` VARCHAR(255) NOT NULL,
    `ma_doanh_nghiep` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã định danh duy nhất',
    `email` VARCHAR(255),
    `so_dien_thoai` VARCHAR(20),
    `dia_chi` TEXT,
    `logo_url` VARCHAR(500),
    `goi_cuoc` ENUM('trial', 'basic', 'pro', 'enterprise') DEFAULT 'trial',
    `ngay_het_han_goi` DATE,
    `trang_thai` TINYINT DEFAULT 1 COMMENT '0=Tạm khóa, 1=Hoạt động, 2=Hết hạn',
    `cau_hinh_json` JSON COMMENT 'Cấu hình riêng của doanh nghiệp',
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_ma_dn` (`ma_doanh_nghiep`),
    INDEX `idx_trang_thai` (`trang_thai`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng NGƯỜI DÙNG (Nhân viên của doanh nghiệp)
CREATE TABLE `nguoi_dung` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `mat_khau` VARCHAR(255) NOT NULL,
    `ho_ten` VARCHAR(255) NOT NULL,
    `so_dien_thoai` VARCHAR(20),
    `anh_dai_dien` VARCHAR(500),
    `vai_tro` ENUM('admin', 'manager', 'technician', 'accountant', 'viewer') DEFAULT 'viewer',
    `phong_ban` VARCHAR(100),
    `trang_thai` TINYINT DEFAULT 1 COMMENT '0=Khóa, 1=Hoạt động',
    `lan_dang_nhap_cuoi` DATETIME,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    UNIQUE KEY `uk_email_dn` (`id_doanh_nghiep`, `email`),
    INDEX `idx_vai_tro` (`vai_tro`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng KHÁCH HÀNG (Khách hàng cuối của doanh nghiệp)
CREATE TABLE `khach_hang` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ma_khach_hang` VARCHAR(50),
    `ten_khach_hang` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255),
    `so_dien_thoai` VARCHAR(20),
    `dia_chi` TEXT,
    `thanh_pho` VARCHAR(100),
    `quan_huyen` VARCHAR(100),
    `toa_do_lat` DECIMAL(10,8) COMMENT 'Vĩ độ GPS',
    `toa_do_lng` DECIMAL(11,8) COMMENT 'Kinh độ GPS',
    `loai_khach` ENUM('ca_nhan', 'doanh_nghiep') DEFAULT 'ca_nhan',
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_ten_kh` (`ten_khach_hang`),
    INDEX `idx_sdt` (`so_dien_thoai`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 2: QUẢN LÝ CÔNG VIỆC (TECHMATE)
-- ============================================================

-- Bảng CÔNG VIỆC (Job)
CREATE TABLE `cong_viec` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36),
    `ma_cong_viec` VARCHAR(50) COMMENT 'Mã công việc tự động',
    `tieu_de` VARCHAR(255) NOT NULL,
    `mo_ta` TEXT,
    `trang_thai` TINYINT DEFAULT 0 COMMENT '0=Mới, 1=Đã phân công, 2=Đang làm, 3=Hoàn thành, 4=Hủy',
    `do_uu_tien` TINYINT DEFAULT 2 COMMENT '1=Thấp, 2=Trung bình, 3=Cao, 4=Khẩn cấp',
    `ngay_hen` DATETIME COMMENT 'Ngày hẹn thực hiện',
    `ngay_hoan_thanh` DATETIME,
    `dia_chi_lam_viec` TEXT,
    `toa_do_lat` DECIMAL(10,8),
    `toa_do_lng` DECIMAL(11,8),
    `thoi_gian_du_kien` INT COMMENT 'Phút',
    `ghi_chu_noi_bo` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_trang_thai` (`trang_thai`),
    INDEX `idx_ngay_hen` (`ngay_hen`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng PHÂN CÔNG
CREATE TABLE `phan_cong` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) NOT NULL,
    `id_nguoi_dung` CHAR(36) NOT NULL COMMENT 'ID thợ được phân công',
    `la_truong_nhom` TINYINT DEFAULT 0,
    `trang_thai` TINYINT DEFAULT 0 COMMENT '0=Chờ xác nhận, 1=Đã nhận, 2=Từ chối',
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    UNIQUE KEY `uk_cv_nd` (`id_cong_viec`, `id_nguoi_dung`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng NGHIỆM THU HÌNH ẢNH
CREATE TABLE `nghiem_thu_hinh_anh` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) NOT NULL,
    `loai_anh` ENUM('truoc', 'sau', 'qua_trinh') DEFAULT 'truoc',
    `url_anh` VARCHAR(500) NOT NULL,
    `mo_ta` VARCHAR(255),
    `toa_do_lat` DECIMAL(10,8),
    `toa_do_lng` DECIMAL(11,8),
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_loai_anh` (`loai_anh`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 3: CHẤM CÔNG & NHÂN SỰ (SHIFTSQUAD)
-- ============================================================

-- Bảng CA LÀM VIỆC
CREATE TABLE `ca_lam_viec` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ten_ca` VARCHAR(100) NOT NULL,
    `gio_bat_dau` TIME NOT NULL,
    `gio_ket_thuc` TIME NOT NULL,
    `ap_dung_thu` VARCHAR(20) DEFAULT '2,3,4,5,6' COMMENT 'Các thứ áp dụng',
    `trang_thai` TINYINT DEFAULT 1,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng CHẤM CÔNG
CREATE TABLE `cham_cong` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_nguoi_dung` CHAR(36) NOT NULL,
    `id_ca_lam_viec` CHAR(36),
    `ngay_lam_viec` DATE NOT NULL,
    `gio_checkin` DATETIME,
    `gio_checkout` DATETIME,
    `toa_do_checkin_lat` DECIMAL(10,8),
    `toa_do_checkin_lng` DECIMAL(11,8),
    `toa_do_checkout_lat` DECIMAL(10,8),
    `toa_do_checkout_lng` DECIMAL(11,8),
    `anh_checkin` VARCHAR(500),
    `anh_checkout` VARCHAR(500),
    `trang_thai` TINYINT DEFAULT 0 COMMENT '0=Chờ duyệt, 1=Hợp lệ, 2=Không hợp lệ',
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    UNIQUE KEY `uk_nd_ngay` (`id_nguoi_dung`, `ngay_lam_viec`),
    INDEX `idx_ngay` (`ngay_lam_viec`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_ca_lam_viec`) REFERENCES `ca_lam_viec`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 4: KHO VẬT TƯ (STOCKPILE)
-- ============================================================

-- Bảng KHO
CREATE TABLE `kho` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ten_kho` VARCHAR(255) NOT NULL,
    `loai_kho` ENUM('co_dinh', 'xe') DEFAULT 'co_dinh',
    `dia_chi` TEXT,
    `id_nguoi_phu_trach` CHAR(36) COMMENT 'Với kho xe, đây là ID thợ',
    `trang_thai` TINYINT DEFAULT 1,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_nguoi_phu_trach`) REFERENCES `nguoi_dung`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng SẢN PHẨM (Vật tư, linh kiện)
CREATE TABLE `san_pham` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ma_sku` VARCHAR(100),
    `ten_san_pham` VARCHAR(255) NOT NULL,
    `mo_ta` TEXT,
    `don_vi_tinh` VARCHAR(50) DEFAULT 'Cái',
    `gia_nhap` DECIMAL(19,4) DEFAULT 0,
    `gia_ban` DECIMAL(19,4) DEFAULT 0,
    `anh_san_pham` VARCHAR(500),
    `danh_muc` VARCHAR(100),
    `trang_thai` TINYINT DEFAULT 1,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    UNIQUE KEY `uk_sku_dn` (`id_doanh_nghiep`, `ma_sku`),
    INDEX `idx_ten_sp` (`ten_san_pham`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng TỒN KHO
CREATE TABLE `ton_kho` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_kho` CHAR(36) NOT NULL,
    `id_san_pham` CHAR(36) NOT NULL,
    `so_luong` INT DEFAULT 0,
    `so_luong_dat_truoc` INT DEFAULT 0 COMMENT 'Đã đặt cho công việc',
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    UNIQUE KEY `uk_kho_sp` (`id_kho`, `id_san_pham`),
    CONSTRAINT `chk_so_luong` CHECK (`so_luong` >= 0),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_kho`) REFERENCES `kho`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng LỊCH SỬ KHO
CREATE TABLE `lich_su_kho` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_kho` CHAR(36) NOT NULL,
    `id_kho_den` CHAR(36) COMMENT 'Kho đích khi chuyển kho',
    `id_san_pham` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) COMMENT 'Liên kết khi xuất cho công việc',
    `loai_phieu` ENUM('nhap', 'xuat', 'chuyen', 'kiem_ke') NOT NULL,
    `so_luong` INT NOT NULL,
    `don_gia` DECIMAL(19,4),
    `ly_do` TEXT,
    `ma_phieu` VARCHAR(50),
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_loai` (`loai_phieu`),
    INDEX `idx_ngay` (`ngay_tao`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_kho`) REFERENCES `kho`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_kho_den`) REFERENCES `kho`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 5: TÀI SẢN & THIẾT BỊ (ASSETTRACK)
-- ============================================================

-- Bảng TÀI SẢN
CREATE TABLE `tai_san` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ma_tai_san` VARCHAR(100),
    `ten_tai_san` VARCHAR(255) NOT NULL,
    `ma_seri` VARCHAR(100),
    `loai_tai_san` VARCHAR(100),
    `ngay_mua` DATE,
    `gia_mua` DECIMAL(19,4),
    `nha_cung_cap` VARCHAR(255),
    `thoi_han_bao_hanh` DATE,
    `vi_tri_hien_tai` VARCHAR(255),
    `trang_thai` TINYINT DEFAULT 1 COMMENT '1=Sẵn sàng, 2=Đang dùng, 3=Bảo trì, 4=Hỏng',
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_ma_seri` (`ma_seri`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng NHẬT KÝ SỬ DỤNG TÀI SẢN
CREATE TABLE `nhat_ky_su_dung` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_tai_san` CHAR(36) NOT NULL,
    `id_nguoi_muon` CHAR(36) NOT NULL,
    `ngay_muon` DATETIME NOT NULL,
    `ngay_tra_du_kien` DATETIME,
    `ngay_tra_thuc_te` DATETIME,
    `tinh_trang_khi_tra` VARCHAR(255),
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_ngay_muon` (`ngay_muon`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_tai_san`) REFERENCES `tai_san`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_nguoi_muon`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 6: LỘ TRÌNH & ĐIỀU PHỐI (ROUTEOPTIMA)
-- ============================================================

-- Bảng LỘ TRÌNH
CREATE TABLE `lo_trinh` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_nguoi_dung` CHAR(36) NOT NULL COMMENT 'Thợ thực hiện',
    `ngay_lo_trinh` DATE NOT NULL,
    `trang_thai` TINYINT DEFAULT 0 COMMENT '0=Kế hoạch, 1=Đang chạy, 2=Hoàn thành',
    `tong_khoang_cach` DECIMAL(10,2) COMMENT 'km',
    `thoi_gian_bat_dau` DATETIME,
    `thoi_gian_ket_thuc` DATETIME,
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_ngay` (`ngay_lo_trinh`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng ĐIỂM DỪNG
CREATE TABLE `diem_dung` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_lo_trinh` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36),
    `thu_tu` INT DEFAULT 0,
    `dia_chi` TEXT,
    `toa_do_lat` DECIMAL(10,8),
    `toa_do_lng` DECIMAL(11,8),
    `thoi_gian_den_du_kien` DATETIME,
    `thoi_gian_den_thuc_te` DATETIME,
    `thoi_gian_roi_di` DATETIME,
    `trang_thai` TINYINT DEFAULT 0 COMMENT '0=Chờ, 1=Đã đến, 2=Bỏ qua',
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_thu_tu` (`thu_tu`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_lo_trinh`) REFERENCES `lo_trinh`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 7: BÁO GIÁ & HỢP ĐỒNG (QUOTEMASTER)
-- ============================================================

-- Bảng BÁO GIÁ
CREATE TABLE `bao_gia` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36),
    `ma_bao_gia` VARCHAR(50),
    `tieu_de` VARCHAR(255),
    `tong_tien` DECIMAL(19,4) DEFAULT 0,
    `thue_vat` DECIMAL(5,2) DEFAULT 0,
    `chiet_khau` DECIMAL(19,4) DEFAULT 0,
    `tong_thanh_toan` DECIMAL(19,4) DEFAULT 0,
    `ngay_het_han` DATE,
    `trang_thai` TINYINT DEFAULT 0 COMMENT '0=Nháp, 1=Đã gửi, 2=Chấp nhận, 3=Từ chối',
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_trang_thai` (`trang_thai`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng CHI TIẾT BÁO GIÁ
CREATE TABLE `chi_tiet_bao_gia` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_bao_gia` CHAR(36) NOT NULL,
    `id_san_pham` CHAR(36),
    `ten_hang_muc` VARCHAR(255) NOT NULL,
    `mo_ta` TEXT,
    `don_vi` VARCHAR(50),
    `so_luong` DECIMAL(10,2) DEFAULT 1,
    `don_gia` DECIMAL(19,4) DEFAULT 0,
    `thanh_tien` DECIMAL(19,4) DEFAULT 0,
    `thu_tu` INT DEFAULT 0,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_bao_gia`) REFERENCES `bao_gia`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng HỢP ĐỒNG
CREATE TABLE `hop_dong` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36),
    `id_bao_gia` CHAR(36) COMMENT 'Tạo từ báo giá nào',
    `ma_hop_dong` VARCHAR(50),
    `ten_hop_dong` VARCHAR(255),
    `gia_tri_hop_dong` DECIMAL(19,4) DEFAULT 0,
    `ngay_ky` DATE,
    `ngay_het_han` DATE,
    `file_pdf_url` VARCHAR(500),
    `chu_ky_so_url` VARCHAR(500),
    `trang_thai` TINYINT DEFAULT 0 COMMENT '0=Nháp, 1=Chờ ký, 2=Đã ký, 3=Hủy',
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_trang_thai` (`trang_thai`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`id_bao_gia`) REFERENCES `bao_gia`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 8: THU CHI NỘI BỘ (CASHFLOW)
-- ============================================================

-- Bảng PHIẾU THU CHI
CREATE TABLE `phieu_thu_chi` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) COMMENT 'Thu/chi liên quan đến công việc nào',
    `id_nguoi_dung` CHAR(36) NOT NULL COMMENT 'Người thu/chi',
    `id_khach_hang` CHAR(36),
    `ma_phieu` VARCHAR(50),
    `loai_phieu` ENUM('thu', 'chi') NOT NULL,
    `so_tien` DECIMAL(19,4) NOT NULL,
    `phuong_thuc` ENUM('tien_mat', 'chuyen_khoan', 'the') DEFAULT 'tien_mat',
    `ly_do` TEXT,
    `danh_muc` VARCHAR(100) COMMENT 'Phân loại: lương, vật tư, thu khách...',
    `ngay_thuc_hien` DATE,
    `anh_chung_tu` VARCHAR(500),
    `trang_thai` TINYINT DEFAULT 1 COMMENT '1=Đã xác nhận, 0=Chờ duyệt',
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_loai` (`loai_phieu`),
    INDEX `idx_ngay` (`ngay_thuc_hien`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 9: CỔNG KHÁCH HÀNG (CUSTOMERPORTAL)
-- ============================================================

-- Bảng TÀI KHOẢN KHÁCH (Portal Login)
CREATE TABLE `tai_khoan_khach` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `mat_khau` VARCHAR(255) NOT NULL,
    `trang_thai` TINYINT DEFAULT 1,
    `lan_dang_nhap_cuoi` DATETIME,
    `token_reset` VARCHAR(255),
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    UNIQUE KEY `uk_email_dn` (`id_doanh_nghiep`, `email`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng ĐÁNH GIÁ
CREATE TABLE `danh_gia` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36),
    `so_sao` TINYINT DEFAULT 5 COMMENT '1-5 sao',
    `nhan_xet` TEXT,
    `phan_hoi_doanh_nghiep` TEXT,
    `an_danh_gia` TINYINT DEFAULT 0,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    CONSTRAINT `chk_so_sao` CHECK (`so_sao` BETWEEN 1 AND 5),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 10: MUA SẮM B2B (PROCUREPOOL)
-- ============================================================

-- Bảng NHÀ CUNG CẤP
CREATE TABLE `nha_cung_cap` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ma_ncc` VARCHAR(50),
    `ten_nha_cung_cap` VARCHAR(255) NOT NULL,
    `nguoi_lien_he` VARCHAR(255),
    `email` VARCHAR(255),
    `so_dien_thoai` VARCHAR(20),
    `dia_chi` TEXT,
    `ma_so_thue` VARCHAR(50),
    `so_tai_khoan` VARCHAR(50),
    `ngan_hang` VARCHAR(100),
    `ghi_chu` TEXT,
    `trang_thai` TINYINT DEFAULT 1,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_ten` (`ten_nha_cung_cap`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng ĐƠN ĐẶT HÀNG NHÀ CUNG CẤP
CREATE TABLE `don_dat_hang_ncc` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_nha_cung_cap` CHAR(36) NOT NULL,
    `id_kho` CHAR(36) COMMENT 'Kho nhập về',
    `ma_don_hang` VARCHAR(50),
    `ngay_dat` DATE,
    `ngay_giao_du_kien` DATE,
    `ngay_giao_thuc_te` DATE,
    `tong_tien` DECIMAL(19,4) DEFAULT 0,
    `trang_thai` TINYINT DEFAULT 0 COMMENT '0=Nháp, 1=Đã gửi, 2=Đang giao, 3=Hoàn thành, 4=Hủy',
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_trang_thai` (`trang_thai`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_nha_cung_cap`) REFERENCES `nha_cung_cap`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_kho`) REFERENCES `kho`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng CHI TIẾT ĐƠN ĐẶT HÀNG NCC
CREATE TABLE `chi_tiet_don_dat_hang` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_don_dat_hang` CHAR(36) NOT NULL,
    `id_san_pham` CHAR(36),
    `ten_san_pham` VARCHAR(255),
    `so_luong` INT DEFAULT 1,
    `don_gia` DECIMAL(19,4) DEFAULT 0,
    `thanh_tien` DECIMAL(19,4) DEFAULT 0,
    `so_luong_da_nhan` INT DEFAULT 0,
    `ghi_chu` TEXT,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_don_dat_hang`) REFERENCES `don_dat_hang_ncc`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 11: HỆ THỐNG THÔNG BÁO (NOTIFICATION)
-- ============================================================

-- Bảng THÔNG BÁO (Dùng chung cho cả hệ thống)
CREATE TABLE `thong_bao` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_nguoi_nhan` CHAR(36) NOT NULL,
    `tieu_de` VARCHAR(255) NOT NULL,
    `noi_dung` TEXT,
    `loai_thong_bao` VARCHAR(50) COMMENT 'cong_viec, kho, cham_cong, he_thong, ...',
    `id_doi_tuong_lien_quan` CHAR(36) COMMENT 'ID của job, phiếu nhập, chấm công...',
    `loai_doi_tuong` VARCHAR(50) COMMENT 'cong_viec, lich_su_kho, cham_cong...',
    `da_xem` TINYINT DEFAULT 0,
    `ngay_xem` DATETIME,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_nguoi_nhan` (`id_nguoi_nhan`),
    INDEX `idx_da_xem` (`da_xem`),
    INDEX `idx_loai` (`loai_thong_bao`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`id_nguoi_nhan`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PHẦN 12: THANH TOÁN SAAS (BILLING - Tiền khách trả cho chủ sàn)
-- ============================================================

-- Bảng THANH TOÁN SAAS
CREATE TABLE `thanh_toan_saas` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ma_hoa_don` VARCHAR(50) COMMENT 'Mã hóa đơn SaaS',
    `so_tien` DECIMAL(19,4) NOT NULL,
    `loai_tien` CHAR(3) DEFAULT 'VND',
    `goi_cuoc` ENUM('trial', 'basic', 'pro', 'enterprise') NOT NULL,
    `chu_ky` ENUM('thang', 'quy', 'nam') DEFAULT 'thang',
    `tu_ngay` DATE NOT NULL,
    `den_ngay` DATE NOT NULL,
    `phuong_thuc` VARCHAR(50) COMMENT 'stripe, momo, vnpay, bank_transfer',
    `ma_giao_dich_cong` VARCHAR(100) COMMENT 'Transaction ID từ cổng thanh toán',
    `trang_thai` TINYINT DEFAULT 0 COMMENT '0=Chờ, 1=Thành công, 2=Thất bại, 3=Hoàn tiền',
    `ghi_chu` TEXT,
    `ngay_thanh_toan` DATETIME,
    `ngay_tao` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `ngay_cap_nhat` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `ngay_xoa` DATETIME NULL,
    `nguoi_tao_id` CHAR(36),
    `nguoi_cap_nhat_id` CHAR(36),
    INDEX `idx_doanh_nghiep` (`id_doanh_nghiep`),
    INDEX `idx_trang_thai` (`trang_thai`),
    INDEX `idx_ky_han` (`tu_ngay`, `den_ngay`),
    FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- END OF SCHEMA - SERVICEOS
-- Tổng: 28 bảng cho 12 phân hệ
-- ============================================================
