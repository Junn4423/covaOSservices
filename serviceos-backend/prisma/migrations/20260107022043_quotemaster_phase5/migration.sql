-- CreateTable
CREATE TABLE `doanh_nghiep` (
    `id` CHAR(36) NOT NULL,
    `ten_doanh_nghiep` VARCHAR(255) NOT NULL,
    `ma_doanh_nghiep` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NULL,
    `so_dien_thoai` VARCHAR(20) NULL,
    `dia_chi` TEXT NULL,
    `logo_url` VARCHAR(500) NULL,
    `goi_cuoc` ENUM('trial', 'basic', 'pro', 'enterprise') NOT NULL DEFAULT 'trial',
    `ngay_het_han_goi` DATE NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `cau_hinh_json` JSON NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    UNIQUE INDEX `doanh_nghiep_ma_doanh_nghiep_key`(`ma_doanh_nghiep`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nguoi_dung` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `mat_khau` VARCHAR(255) NOT NULL,
    `ho_ten` VARCHAR(255) NOT NULL,
    `so_dien_thoai` VARCHAR(20) NULL,
    `anh_dai_dien` VARCHAR(500) NULL,
    `vai_tro` ENUM('admin', 'manager', 'technician', 'accountant', 'viewer') NOT NULL DEFAULT 'viewer',
    `phong_ban` VARCHAR(100) NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `lan_dang_nhap_cuoi` DATETIME(3) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `nguoi_dung_vai_tro_idx`(`vai_tro`),
    UNIQUE INDEX `nguoi_dung_id_doanh_nghiep_email_key`(`id_doanh_nghiep`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nhat_ky_hoat_dong` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `nguoi_thuc_hien_id` CHAR(36) NULL,
    `hanh_dong` ENUM('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'ASSIGN', 'APPROVE', 'REJECT', 'COMPLETE', 'CANCEL', 'EXPORT', 'IMPORT', 'SYSTEM') NOT NULL,
    `doi_tuong` VARCHAR(50) NOT NULL,
    `id_doi_tuong` CHAR(36) NULL,
    `mo_ta` VARCHAR(500) NULL,
    `du_lieu_cu` JSON NULL,
    `du_lieu_moi` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `endpoint` VARCHAR(255) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `nhat_ky_hoat_dong_id_doanh_nghiep_idx`(`id_doanh_nghiep`),
    INDEX `nhat_ky_hoat_dong_nguoi_thuc_hien_id_idx`(`nguoi_thuc_hien_id`),
    INDEX `nhat_ky_hoat_dong_hanh_dong_idx`(`hanh_dong`),
    INDEX `nhat_ky_hoat_dong_doi_tuong_idx`(`doi_tuong`),
    INDEX `nhat_ky_hoat_dong_ngay_tao_idx`(`ngay_tao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_token` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `nguoi_dung_id` CHAR(36) NOT NULL,
    `token` VARCHAR(500) NOT NULL,
    `ngay_het_han` DATETIME(3) NOT NULL,
    `da_revoke` BOOLEAN NOT NULL DEFAULT false,
    `device_info` VARCHAR(255) NULL,
    `ip_address` VARCHAR(45) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,

    UNIQUE INDEX `refresh_token_token_key`(`token`),
    INDEX `refresh_token_nguoi_dung_id_idx`(`nguoi_dung_id`),
    INDEX `refresh_token_ngay_het_han_idx`(`ngay_het_han`),
    INDEX `refresh_token_da_revoke_idx`(`da_revoke`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `khach_hang` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ma_khach_hang` VARCHAR(50) NULL,
    `ho_ten` VARCHAR(255) NOT NULL,
    `so_dien_thoai` VARCHAR(20) NULL,
    `email` VARCHAR(255) NULL,
    `dia_chi` TEXT NULL,
    `thanh_pho` VARCHAR(100) NULL,
    `quan_huyen` VARCHAR(100) NULL,
    `toa_do_lat` DECIMAL(10, 8) NULL,
    `toa_do_lng` DECIMAL(11, 8) NULL,
    `loai_khach` ENUM('ca_nhan', 'doanh_nghiep') NOT NULL DEFAULT 'ca_nhan',
    `nguon_khach` ENUM('FACEBOOK', 'WEBSITE', 'REFERRAL', 'KHAC') NOT NULL DEFAULT 'KHAC',
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nguoi_tao_id` CHAR(36) NULL,
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,
    `ngay_xoa` DATETIME(3) NULL,

    INDEX `khach_hang_id_doanh_nghiep_idx`(`id_doanh_nghiep`),
    INDEX `khach_hang_ho_ten_idx`(`ho_ten`),
    INDEX `khach_hang_so_dien_thoai_idx`(`so_dien_thoai`),
    UNIQUE INDEX `khach_hang_ma_khach_hang_id_doanh_nghiep_key`(`ma_khach_hang`, `id_doanh_nghiep`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cong_viec` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36) NULL,
    `ma_cong_viec` VARCHAR(50) NULL,
    `tieu_de` VARCHAR(255) NOT NULL,
    `mo_ta` TEXT NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 0,
    `do_uu_tien` TINYINT NOT NULL DEFAULT 2,
    `ngay_hen` DATETIME(3) NULL,
    `ngay_hoan_thanh` DATETIME(3) NULL,
    `dia_chi_lam_viec` TEXT NULL,
    `toa_do_lat` DECIMAL(10, 8) NULL,
    `toa_do_lng` DECIMAL(11, 8) NULL,
    `thoi_gian_du_kien` INTEGER NULL,
    `ghi_chu_noi_bo` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `cong_viec_trang_thai_idx`(`trang_thai`),
    INDEX `cong_viec_ngay_hen_idx`(`ngay_hen`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phan_cong` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) NOT NULL,
    `id_nguoi_dung` CHAR(36) NOT NULL,
    `la_truong_nhom` TINYINT NOT NULL DEFAULT 0,
    `trang_thai` TINYINT NOT NULL DEFAULT 0,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    UNIQUE INDEX `phan_cong_id_cong_viec_id_nguoi_dung_key`(`id_cong_viec`, `id_nguoi_dung`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nghiem_thu_hinh_anh` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) NOT NULL,
    `loai_anh` ENUM('truoc', 'sau', 'qua_trinh') NOT NULL DEFAULT 'truoc',
    `url_anh` VARCHAR(500) NOT NULL,
    `mo_ta` VARCHAR(255) NULL,
    `toa_do_lat` DECIMAL(10, 8) NULL,
    `toa_do_lng` DECIMAL(11, 8) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `nghiem_thu_hinh_anh_loai_anh_idx`(`loai_anh`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ca_lam_viec` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ten_ca` VARCHAR(100) NOT NULL,
    `gio_bat_dau` TIME NOT NULL,
    `gio_ket_thuc` TIME NOT NULL,
    `ap_dung_thu` VARCHAR(20) NOT NULL DEFAULT '2,3,4,5,6',
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cham_cong` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_nguoi_dung` CHAR(36) NOT NULL,
    `id_ca_lam_viec` CHAR(36) NULL,
    `ngay_lam_viec` DATE NOT NULL,
    `gio_checkin` DATETIME(3) NULL,
    `gio_checkout` DATETIME(3) NULL,
    `toa_do_checkin_lat` DECIMAL(10, 8) NULL,
    `toa_do_checkin_lng` DECIMAL(11, 8) NULL,
    `toa_do_checkout_lat` DECIMAL(10, 8) NULL,
    `toa_do_checkout_lng` DECIMAL(11, 8) NULL,
    `anh_checkin` VARCHAR(500) NULL,
    `anh_checkout` VARCHAR(500) NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 0,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `cham_cong_ngay_lam_viec_idx`(`ngay_lam_viec`),
    UNIQUE INDEX `cham_cong_id_nguoi_dung_ngay_lam_viec_key`(`id_nguoi_dung`, `ngay_lam_viec`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kho` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ten_kho` VARCHAR(255) NOT NULL,
    `loai_kho` ENUM('co_dinh', 'xe') NOT NULL DEFAULT 'co_dinh',
    `dia_chi` TEXT NULL,
    `id_nguoi_phu_trach` CHAR(36) NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nhom_san_pham` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ten_nhom` VARCHAR(255) NOT NULL,
    `mo_ta` TEXT NULL,
    `thu_tu` INTEGER NOT NULL DEFAULT 0,
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nguoi_tao_id` CHAR(36) NULL,
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,
    `ngay_xoa` DATETIME(3) NULL,

    INDEX `nhom_san_pham_id_doanh_nghiep_idx`(`id_doanh_nghiep`),
    INDEX `nhom_san_pham_ten_nhom_idx`(`ten_nhom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `san_pham` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_nhom_san_pham` CHAR(36) NULL,
    `ma_san_pham` VARCHAR(100) NULL,
    `ten_san_pham` VARCHAR(255) NOT NULL,
    `loai_san_pham` ENUM('HANG_HOA', 'DICH_VU', 'COMBO') NOT NULL DEFAULT 'HANG_HOA',
    `mo_ta` TEXT NULL,
    `gia_ban` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `gia_von` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `don_vi_tinh` VARCHAR(50) NULL,
    `hinh_anh` VARCHAR(500) NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nguoi_tao_id` CHAR(36) NULL,
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,
    `ngay_xoa` DATETIME(3) NULL,

    INDEX `san_pham_id_doanh_nghiep_idx`(`id_doanh_nghiep`),
    INDEX `san_pham_id_nhom_san_pham_idx`(`id_nhom_san_pham`),
    INDEX `san_pham_ten_san_pham_idx`(`ten_san_pham`),
    INDEX `san_pham_loai_san_pham_idx`(`loai_san_pham`),
    UNIQUE INDEX `san_pham_ma_san_pham_id_doanh_nghiep_key`(`ma_san_pham`, `id_doanh_nghiep`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ton_kho` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_kho` CHAR(36) NOT NULL,
    `id_san_pham` CHAR(36) NOT NULL,
    `so_luong` INTEGER NOT NULL DEFAULT 0,
    `so_luong_dat_truoc` INTEGER NOT NULL DEFAULT 0,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    UNIQUE INDEX `ton_kho_id_kho_id_san_pham_key`(`id_kho`, `id_san_pham`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lich_su_kho` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_kho` CHAR(36) NOT NULL,
    `id_kho_den` CHAR(36) NULL,
    `id_san_pham` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) NULL,
    `loai_phieu` ENUM('nhap', 'xuat', 'chuyen', 'kiem_ke') NOT NULL,
    `so_luong` INTEGER NOT NULL,
    `don_gia` DECIMAL(19, 4) NULL,
    `ly_do` TEXT NULL,
    `ma_phieu` VARCHAR(50) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `lich_su_kho_loai_phieu_idx`(`loai_phieu`),
    INDEX `lich_su_kho_ngay_tao_idx`(`ngay_tao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tai_san` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ma_tai_san` VARCHAR(100) NULL,
    `ten_tai_san` VARCHAR(255) NOT NULL,
    `ma_seri` VARCHAR(100) NULL,
    `loai_tai_san` VARCHAR(100) NULL,
    `ngay_mua` DATE NULL,
    `gia_mua` DECIMAL(19, 4) NULL,
    `nha_cung_cap` VARCHAR(255) NULL,
    `thoi_han_bao_hanh` DATE NULL,
    `vi_tri_hien_tai` VARCHAR(255) NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `tai_san_ma_seri_idx`(`ma_seri`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nhat_ky_su_dung` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_tai_san` CHAR(36) NOT NULL,
    `id_nguoi_muon` CHAR(36) NOT NULL,
    `ngay_muon` DATETIME(3) NOT NULL,
    `ngay_tra_du_kien` DATETIME(3) NULL,
    `ngay_tra_thuc_te` DATETIME(3) NULL,
    `tinh_trang_khi_tra` VARCHAR(255) NULL,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `nhat_ky_su_dung_ngay_muon_idx`(`ngay_muon`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lo_trinh` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_nguoi_dung` CHAR(36) NOT NULL,
    `ngay_lo_trinh` DATE NOT NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 0,
    `tong_khoang_cach` DECIMAL(10, 2) NULL,
    `thoi_gian_bat_dau` DATETIME(3) NULL,
    `thoi_gian_ket_thuc` DATETIME(3) NULL,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `lo_trinh_ngay_lo_trinh_idx`(`ngay_lo_trinh`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `diem_dung` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_lo_trinh` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) NULL,
    `thu_tu` INTEGER NOT NULL DEFAULT 0,
    `dia_chi` TEXT NULL,
    `toa_do_lat` DECIMAL(10, 8) NULL,
    `toa_do_lng` DECIMAL(11, 8) NULL,
    `thoi_gian_den_du_kien` DATETIME(3) NULL,
    `thoi_gian_den_thuc_te` DATETIME(3) NULL,
    `thoi_gian_roi_di` DATETIME(3) NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 0,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `diem_dung_thu_tu_idx`(`thu_tu`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bao_gia` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36) NOT NULL,
    `ma_bao_gia` VARCHAR(50) NOT NULL,
    `tieu_de` VARCHAR(255) NULL,
    `ngay_bao_gia` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_het_han` DATE NULL,
    `trang_thai` ENUM('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'DRAFT',
    `tong_tien_truoc_thue` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `thue_vat` DECIMAL(5, 2) NOT NULL DEFAULT 10,
    `tien_thue` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `tong_tien_sau_thue` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nguoi_tao_id` CHAR(36) NULL,
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,
    `ngay_xoa` DATETIME(3) NULL,

    INDEX `bao_gia_id_doanh_nghiep_idx`(`id_doanh_nghiep`),
    INDEX `bao_gia_id_khach_hang_idx`(`id_khach_hang`),
    INDEX `bao_gia_trang_thai_idx`(`trang_thai`),
    INDEX `bao_gia_ngay_bao_gia_idx`(`ngay_bao_gia`),
    UNIQUE INDEX `bao_gia_ma_bao_gia_id_doanh_nghiep_key`(`ma_bao_gia`, `id_doanh_nghiep`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chi_tiet_bao_gia` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_bao_gia` CHAR(36) NOT NULL,
    `id_san_pham` CHAR(36) NOT NULL,
    `so_luong` INTEGER NOT NULL DEFAULT 1,
    `don_gia` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `thanh_tien` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `ghi_chu` VARCHAR(500) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `nguoi_tao_id` CHAR(36) NULL,
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,
    `ngay_xoa` DATETIME(3) NULL,

    INDEX `chi_tiet_bao_gia_id_bao_gia_idx`(`id_bao_gia`),
    INDEX `chi_tiet_bao_gia_id_san_pham_idx`(`id_san_pham`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hop_dong` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36) NULL,
    `id_bao_gia` CHAR(36) NULL,
    `ma_hop_dong` VARCHAR(50) NULL,
    `ten_hop_dong` VARCHAR(255) NULL,
    `gia_tri_hop_dong` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `ngay_ky` DATE NULL,
    `ngay_het_han` DATE NULL,
    `file_pdf_url` VARCHAR(500) NULL,
    `chu_ky_so_url` VARCHAR(500) NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 0,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `hop_dong_trang_thai_idx`(`trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phieu_thu_chi` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) NULL,
    `id_nguoi_dung` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36) NULL,
    `ma_phieu` VARCHAR(50) NULL,
    `loai_phieu` ENUM('thu', 'chi') NOT NULL,
    `so_tien` DECIMAL(19, 4) NOT NULL,
    `phuong_thuc` ENUM('tien_mat', 'chuyen_khoan', 'the') NOT NULL DEFAULT 'tien_mat',
    `ly_do` TEXT NULL,
    `danh_muc` VARCHAR(100) NULL,
    `ngay_thuc_hien` DATE NULL,
    `anh_chung_tu` VARCHAR(500) NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `phieu_thu_chi_loai_phieu_idx`(`loai_phieu`),
    INDEX `phieu_thu_chi_ngay_thuc_hien_idx`(`ngay_thuc_hien`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tai_khoan_khach` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `mat_khau` VARCHAR(255) NOT NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `lan_dang_nhap_cuoi` DATETIME(3) NULL,
    `token_reset` VARCHAR(255) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    UNIQUE INDEX `tai_khoan_khach_id_doanh_nghiep_email_key`(`id_doanh_nghiep`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `danh_gia` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_cong_viec` CHAR(36) NOT NULL,
    `id_khach_hang` CHAR(36) NULL,
    `so_sao` TINYINT NOT NULL DEFAULT 5,
    `nhan_xet` TEXT NULL,
    `phan_hoi_doanh_nghiep` TEXT NULL,
    `an_danh_gia` TINYINT NOT NULL DEFAULT 0,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nha_cung_cap` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ma_ncc` VARCHAR(50) NULL,
    `ten_nha_cung_cap` VARCHAR(255) NOT NULL,
    `nguoi_lien_he` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `so_dien_thoai` VARCHAR(20) NULL,
    `dia_chi` TEXT NULL,
    `ma_so_thue` VARCHAR(50) NULL,
    `so_tai_khoan` VARCHAR(50) NULL,
    `ngan_hang` VARCHAR(100) NULL,
    `ghi_chu` TEXT NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 1,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `nha_cung_cap_ten_nha_cung_cap_idx`(`ten_nha_cung_cap`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `don_dat_hang_ncc` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_nha_cung_cap` CHAR(36) NOT NULL,
    `id_kho` CHAR(36) NULL,
    `ma_don_hang` VARCHAR(50) NULL,
    `ngay_dat` DATE NULL,
    `ngay_giao_du_kien` DATE NULL,
    `ngay_giao_thuc_te` DATE NULL,
    `tong_tien` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `trang_thai` TINYINT NOT NULL DEFAULT 0,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `don_dat_hang_ncc_trang_thai_idx`(`trang_thai`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chi_tiet_don_dat_hang` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_don_dat_hang` CHAR(36) NOT NULL,
    `id_san_pham` CHAR(36) NULL,
    `ten_san_pham` VARCHAR(255) NULL,
    `so_luong` INTEGER NOT NULL DEFAULT 1,
    `don_gia` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `thanh_tien` DECIMAL(19, 4) NOT NULL DEFAULT 0,
    `so_luong_da_nhan` INTEGER NOT NULL DEFAULT 0,
    `ghi_chu` TEXT NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thong_bao` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `id_nguoi_nhan` CHAR(36) NOT NULL,
    `tieu_de` VARCHAR(255) NOT NULL,
    `noi_dung` TEXT NULL,
    `loai_thong_bao` VARCHAR(50) NULL,
    `id_doi_tuong_lien_quan` CHAR(36) NULL,
    `loai_doi_tuong` VARCHAR(50) NULL,
    `da_xem` TINYINT NOT NULL DEFAULT 0,
    `ngay_xem` DATETIME(3) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `thong_bao_id_nguoi_nhan_idx`(`id_nguoi_nhan`),
    INDEX `thong_bao_da_xem_idx`(`da_xem`),
    INDEX `thong_bao_loai_thong_bao_idx`(`loai_thong_bao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `thanh_toan_saas` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `ma_hoa_don` VARCHAR(50) NULL,
    `so_tien` DECIMAL(19, 4) NOT NULL,
    `loai_tien` CHAR(3) NOT NULL DEFAULT 'VND',
    `goi_cuoc` ENUM('trial', 'basic', 'pro', 'enterprise') NOT NULL,
    `chu_ky` ENUM('thang', 'quy', 'nam') NOT NULL DEFAULT 'thang',
    `tu_ngay` DATE NOT NULL,
    `den_ngay` DATE NOT NULL,
    `phuong_thuc` VARCHAR(50) NULL,
    `ma_giao_dich_cong` VARCHAR(100) NULL,
    `trang_thai` TINYINT NOT NULL DEFAULT 0,
    `ghi_chu` TEXT NULL,
    `ngay_thanh_toan` DATETIME(3) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `nguoi_cap_nhat_id` CHAR(36) NULL,

    INDEX `thanh_toan_saas_id_doanh_nghiep_idx`(`id_doanh_nghiep`),
    INDEX `thanh_toan_saas_trang_thai_idx`(`trang_thai`),
    INDEX `thanh_toan_saas_tu_ngay_den_ngay_idx`(`tu_ngay`, `den_ngay`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `nguoi_dung` ADD CONSTRAINT `nguoi_dung_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nhat_ky_hoat_dong` ADD CONSTRAINT `nhat_ky_hoat_dong_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nhat_ky_hoat_dong` ADD CONSTRAINT `nhat_ky_hoat_dong_nguoi_thuc_hien_id_fkey` FOREIGN KEY (`nguoi_thuc_hien_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_token` ADD CONSTRAINT `refresh_token_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_token` ADD CONSTRAINT `refresh_token_nguoi_dung_id_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `khach_hang` ADD CONSTRAINT `khach_hang_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cong_viec` ADD CONSTRAINT `cong_viec_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cong_viec` ADD CONSTRAINT `cong_viec_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phan_cong` ADD CONSTRAINT `phan_cong_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phan_cong` ADD CONSTRAINT `phan_cong_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phan_cong` ADD CONSTRAINT `phan_cong_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nghiem_thu_hinh_anh` ADD CONSTRAINT `nghiem_thu_hinh_anh_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nghiem_thu_hinh_anh` ADD CONSTRAINT `nghiem_thu_hinh_anh_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ca_lam_viec` ADD CONSTRAINT `ca_lam_viec_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cham_cong` ADD CONSTRAINT `cham_cong_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cham_cong` ADD CONSTRAINT `cham_cong_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cham_cong` ADD CONSTRAINT `cham_cong_id_ca_lam_viec_fkey` FOREIGN KEY (`id_ca_lam_viec`) REFERENCES `ca_lam_viec`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kho` ADD CONSTRAINT `kho_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kho` ADD CONSTRAINT `kho_id_nguoi_phu_trach_fkey` FOREIGN KEY (`id_nguoi_phu_trach`) REFERENCES `nguoi_dung`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nhom_san_pham` ADD CONSTRAINT `nhom_san_pham_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `san_pham` ADD CONSTRAINT `san_pham_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `san_pham` ADD CONSTRAINT `san_pham_id_nhom_san_pham_fkey` FOREIGN KEY (`id_nhom_san_pham`) REFERENCES `nhom_san_pham`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ton_kho` ADD CONSTRAINT `ton_kho_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ton_kho` ADD CONSTRAINT `ton_kho_id_kho_fkey` FOREIGN KEY (`id_kho`) REFERENCES `kho`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ton_kho` ADD CONSTRAINT `ton_kho_id_san_pham_fkey` FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lich_su_kho` ADD CONSTRAINT `lich_su_kho_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lich_su_kho` ADD CONSTRAINT `lich_su_kho_id_kho_fkey` FOREIGN KEY (`id_kho`) REFERENCES `kho`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lich_su_kho` ADD CONSTRAINT `lich_su_kho_id_kho_den_fkey` FOREIGN KEY (`id_kho_den`) REFERENCES `kho`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lich_su_kho` ADD CONSTRAINT `lich_su_kho_id_san_pham_fkey` FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lich_su_kho` ADD CONSTRAINT `lich_su_kho_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tai_san` ADD CONSTRAINT `tai_san_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nhat_ky_su_dung` ADD CONSTRAINT `nhat_ky_su_dung_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nhat_ky_su_dung` ADD CONSTRAINT `nhat_ky_su_dung_id_tai_san_fkey` FOREIGN KEY (`id_tai_san`) REFERENCES `tai_san`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nhat_ky_su_dung` ADD CONSTRAINT `nhat_ky_su_dung_id_nguoi_muon_fkey` FOREIGN KEY (`id_nguoi_muon`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lo_trinh` ADD CONSTRAINT `lo_trinh_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lo_trinh` ADD CONSTRAINT `lo_trinh_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diem_dung` ADD CONSTRAINT `diem_dung_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diem_dung` ADD CONSTRAINT `diem_dung_id_lo_trinh_fkey` FOREIGN KEY (`id_lo_trinh`) REFERENCES `lo_trinh`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `diem_dung` ADD CONSTRAINT `diem_dung_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bao_gia` ADD CONSTRAINT `bao_gia_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bao_gia` ADD CONSTRAINT `bao_gia_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_bao_gia` ADD CONSTRAINT `chi_tiet_bao_gia_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_bao_gia` ADD CONSTRAINT `chi_tiet_bao_gia_id_bao_gia_fkey` FOREIGN KEY (`id_bao_gia`) REFERENCES `bao_gia`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_bao_gia` ADD CONSTRAINT `chi_tiet_bao_gia_id_san_pham_fkey` FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hop_dong` ADD CONSTRAINT `hop_dong_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hop_dong` ADD CONSTRAINT `hop_dong_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hop_dong` ADD CONSTRAINT `hop_dong_id_bao_gia_fkey` FOREIGN KEY (`id_bao_gia`) REFERENCES `bao_gia`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phieu_thu_chi` ADD CONSTRAINT `phieu_thu_chi_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phieu_thu_chi` ADD CONSTRAINT `phieu_thu_chi_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phieu_thu_chi` ADD CONSTRAINT `phieu_thu_chi_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phieu_thu_chi` ADD CONSTRAINT `phieu_thu_chi_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tai_khoan_khach` ADD CONSTRAINT `tai_khoan_khach_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tai_khoan_khach` ADD CONSTRAINT `tai_khoan_khach_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `danh_gia` ADD CONSTRAINT `danh_gia_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `danh_gia` ADD CONSTRAINT `danh_gia_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `danh_gia` ADD CONSTRAINT `danh_gia_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nha_cung_cap` ADD CONSTRAINT `nha_cung_cap_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `don_dat_hang_ncc` ADD CONSTRAINT `don_dat_hang_ncc_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `don_dat_hang_ncc` ADD CONSTRAINT `don_dat_hang_ncc_id_nha_cung_cap_fkey` FOREIGN KEY (`id_nha_cung_cap`) REFERENCES `nha_cung_cap`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `don_dat_hang_ncc` ADD CONSTRAINT `don_dat_hang_ncc_id_kho_fkey` FOREIGN KEY (`id_kho`) REFERENCES `kho`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_don_dat_hang` ADD CONSTRAINT `chi_tiet_don_dat_hang_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_don_dat_hang` ADD CONSTRAINT `chi_tiet_don_dat_hang_id_don_dat_hang_fkey` FOREIGN KEY (`id_don_dat_hang`) REFERENCES `don_dat_hang_ncc`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chi_tiet_don_dat_hang` ADD CONSTRAINT `chi_tiet_don_dat_hang_id_san_pham_fkey` FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thong_bao` ADD CONSTRAINT `thong_bao_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thong_bao` ADD CONSTRAINT `thong_bao_id_nguoi_nhan_fkey` FOREIGN KEY (`id_nguoi_nhan`) REFERENCES `nguoi_dung`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thanh_toan_saas` ADD CONSTRAINT `thanh_toan_saas_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
