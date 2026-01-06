-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 06, 2026 at 08:10 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `covaosservices`
--

-- --------------------------------------------------------

--
-- Table structure for table `bao_gia`
--

CREATE TABLE `bao_gia` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_khach_hang` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_bao_gia` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tieu_de` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tong_tien` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `thue_vat` decimal(5,2) NOT NULL DEFAULT '0.00',
  `chiet_khau` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `tong_thanh_toan` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `ngay_het_han` date DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '0',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ca_lam_viec`
--

CREATE TABLE `ca_lam_viec` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_ca` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gio_bat_dau` time NOT NULL,
  `gio_ket_thuc` time NOT NULL,
  `ap_dung_thu` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2,3,4,5,6',
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cham_cong`
--

CREATE TABLE `cham_cong` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_nguoi_dung` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_ca_lam_viec` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_lam_viec` date NOT NULL,
  `gio_checkin` datetime(3) DEFAULT NULL,
  `gio_checkout` datetime(3) DEFAULT NULL,
  `toa_do_checkin_lat` decimal(10,8) DEFAULT NULL,
  `toa_do_checkin_lng` decimal(11,8) DEFAULT NULL,
  `toa_do_checkout_lat` decimal(10,8) DEFAULT NULL,
  `toa_do_checkout_lng` decimal(11,8) DEFAULT NULL,
  `anh_checkin` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `anh_checkout` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '0',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chi_tiet_bao_gia`
--

CREATE TABLE `chi_tiet_bao_gia` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_bao_gia` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_san_pham` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ten_hang_muc` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `don_vi` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_luong` decimal(10,2) NOT NULL DEFAULT '1.00',
  `don_gia` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `thanh_tien` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `thu_tu` int NOT NULL DEFAULT '0',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chi_tiet_don_dat_hang`
--

CREATE TABLE `chi_tiet_don_dat_hang` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_don_dat_hang` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_san_pham` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ten_san_pham` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_luong` int NOT NULL DEFAULT '1',
  `don_gia` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `thanh_tien` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `so_luong_da_nhan` int NOT NULL DEFAULT '0',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cong_viec`
--

CREATE TABLE `cong_viec` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_khach_hang` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_cong_viec` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tieu_de` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` tinyint NOT NULL DEFAULT '0',
  `do_uu_tien` tinyint NOT NULL DEFAULT '2',
  `ngay_hen` datetime(3) DEFAULT NULL,
  `ngay_hoan_thanh` datetime(3) DEFAULT NULL,
  `dia_chi_lam_viec` text COLLATE utf8mb4_unicode_ci,
  `toa_do_lat` decimal(10,8) DEFAULT NULL,
  `toa_do_lng` decimal(11,8) DEFAULT NULL,
  `thoi_gian_du_kien` int DEFAULT NULL,
  `ghi_chu_noi_bo` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danh_gia`
--

CREATE TABLE `danh_gia` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_cong_viec` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_khach_hang` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_sao` tinyint NOT NULL DEFAULT '5',
  `nhan_xet` text COLLATE utf8mb4_unicode_ci,
  `phan_hoi_doanh_nghiep` text COLLATE utf8mb4_unicode_ci,
  `an_danh_gia` tinyint NOT NULL DEFAULT '0',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `diem_dung`
--

CREATE TABLE `diem_dung` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_lo_trinh` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_cong_viec` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thu_tu` int NOT NULL DEFAULT '0',
  `dia_chi` text COLLATE utf8mb4_unicode_ci,
  `toa_do_lat` decimal(10,8) DEFAULT NULL,
  `toa_do_lng` decimal(11,8) DEFAULT NULL,
  `thoi_gian_den_du_kien` datetime(3) DEFAULT NULL,
  `thoi_gian_den_thuc_te` datetime(3) DEFAULT NULL,
  `thoi_gian_roi_di` datetime(3) DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '0',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `doanh_nghiep`
--

CREATE TABLE `doanh_nghiep` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_doanh_nghiep` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_doanh_nghiep` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_chi` text COLLATE utf8mb4_unicode_ci,
  `logo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `goi_cuoc` enum('trial','basic','pro','enterprise') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'trial',
  `ngay_het_han_goi` date DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `cau_hinh_json` json DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `doanh_nghiep`
--

INSERT INTO `doanh_nghiep` (`id`, `ten_doanh_nghiep`, `ma_doanh_nghiep`, `email`, `so_dien_thoai`, `dia_chi`, `logo_url`, `goi_cuoc`, `ngay_het_han_goi`, `trang_thai`, `cau_hinh_json`, `ngay_tao`, `ngay_cap_nhat`, `ngay_xoa`, `nguoi_tao_id`, `nguoi_cap_nhat_id`) VALUES
('c5cd291f-560c-4e58-bff9-3edc13435cc0', 'Tech Master Service', 'TECH_MASTER', 'contact@techmaster.vn', '0909999888', '123 Công Nghệ, Q.1, TP.HCM', NULL, 'pro', NULL, 1, NULL, '2026-01-06 20:06:29.251', '2026-01-06 20:06:29.251', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `don_dat_hang_ncc`
--

CREATE TABLE `don_dat_hang_ncc` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_nha_cung_cap` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kho` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_don_hang` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_dat` date DEFAULT NULL,
  `ngay_giao_du_kien` date DEFAULT NULL,
  `ngay_giao_thuc_te` date DEFAULT NULL,
  `tong_tien` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `trang_thai` tinyint NOT NULL DEFAULT '0',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hop_dong`
--

CREATE TABLE `hop_dong` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_khach_hang` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_bao_gia` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_hop_dong` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ten_hop_dong` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gia_tri_hop_dong` decimal(19,4) NOT NULL DEFAULT '0.0000',
  `ngay_ky` date DEFAULT NULL,
  `ngay_het_han` date DEFAULT NULL,
  `file_pdf_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chu_ky_so_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '0',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `khach_hang`
--

CREATE TABLE `khach_hang` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_khach_hang` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ho_ten` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_chi` text COLLATE utf8mb4_unicode_ci,
  `thanh_pho` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quan_huyen` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toa_do_lat` decimal(10,8) DEFAULT NULL,
  `toa_do_lng` decimal(11,8) DEFAULT NULL,
  `loai_khach` enum('ca_nhan','doanh_nghiep') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ca_nhan',
  `nguon_khach` enum('FACEBOOK','WEBSITE','REFERRAL','KHAC') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'KHAC',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `khach_hang`
--

INSERT INTO `khach_hang` (`id`, `id_doanh_nghiep`, `ma_khach_hang`, `ho_ten`, `so_dien_thoai`, `email`, `dia_chi`, `thanh_pho`, `quan_huyen`, `toa_do_lat`, `toa_do_lng`, `loai_khach`, `nguon_khach`, `ghi_chu`, `ngay_tao`, `nguoi_tao_id`, `ngay_cap_nhat`, `nguoi_cap_nhat_id`, `ngay_xoa`) VALUES
('6cd2c675-5d1d-4b2e-bc82-3a267c723e84', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'KH-1767729989321-298', 'Trần Thị B', '0902345678', 'thib@gmail.com', NULL, NULL, NULL, NULL, NULL, 'ca_nhan', 'WEBSITE', NULL, '2026-01-06 20:06:29.322', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.322', NULL, NULL),
('9a50e325-8aa0-41fa-9732-3083fdefbd4a', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'KH-1767729989317-682', 'Nguyễn Văn A', '0901234567', 'vana@gmail.com', NULL, NULL, NULL, NULL, NULL, 'ca_nhan', 'FACEBOOK', NULL, '2026-01-06 20:06:29.318', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.318', NULL, NULL),
('d81916e5-d52f-4dd5-9957-2c7f8fc0cce8', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'KH-1767729989324-794', 'Lê Văn C', '0903456789', 'vanc@gmail.com', NULL, NULL, NULL, NULL, NULL, 'ca_nhan', 'REFERRAL', NULL, '2026-01-06 20:06:29.325', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.325', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `kho`
--

CREATE TABLE `kho` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_kho` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai_kho` enum('co_dinh','xe') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'co_dinh',
  `dia_chi` text COLLATE utf8mb4_unicode_ci,
  `id_nguoi_phu_trach` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lich_su_kho`
--

CREATE TABLE `lich_su_kho` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kho` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kho_den` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_san_pham` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_cong_viec` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai_phieu` enum('nhap','xuat','chuyen','kiem_ke') COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_luong` int NOT NULL,
  `don_gia` decimal(19,4) DEFAULT NULL,
  `ly_do` text COLLATE utf8mb4_unicode_ci,
  `ma_phieu` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lo_trinh`
--

CREATE TABLE `lo_trinh` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_nguoi_dung` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_lo_trinh` date NOT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '0',
  `tong_khoang_cach` decimal(10,2) DEFAULT NULL,
  `thoi_gian_bat_dau` datetime(3) DEFAULT NULL,
  `thoi_gian_ket_thuc` datetime(3) DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nghiem_thu_hinh_anh`
--

CREATE TABLE `nghiem_thu_hinh_anh` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_cong_viec` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai_anh` enum('truoc','sau','qua_trinh') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'truoc',
  `url_anh` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `toa_do_lat` decimal(10,8) DEFAULT NULL,
  `toa_do_lng` decimal(11,8) DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nguoi_dung`
--

CREATE TABLE `nguoi_dung` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ho_ten` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_dien_thoai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `anh_dai_dien` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vai_tro` enum('admin','manager','technician','accountant','viewer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'viewer',
  `phong_ban` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `lan_dang_nhap_cuoi` datetime(3) DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nguoi_dung`
--

INSERT INTO `nguoi_dung` (`id`, `id_doanh_nghiep`, `email`, `mat_khau`, `ho_ten`, `so_dien_thoai`, `anh_dai_dien`, `vai_tro`, `phong_ban`, `trang_thai`, `lan_dang_nhap_cuoi`, `ngay_tao`, `ngay_cap_nhat`, `ngay_xoa`, `nguoi_tao_id`, `nguoi_cap_nhat_id`) VALUES
('cb01ca04-3b0a-4d31-b36f-c1a9749bded3', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'admin@techmaster.vn', '$2b$10$HQd2cquLafxssg1sxwMHZeFBpgFtVMZkAZC6gSlQLPpqAFTrjTUma', 'Admin Quản Trị', '0901111222', NULL, 'admin', NULL, 1, '2026-01-06 20:07:09.140', '2026-01-06 20:06:29.312', '2026-01-06 20:07:09.142', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `nhat_ky_hoat_dong`
--

CREATE TABLE `nhat_ky_hoat_dong` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nguoi_thuc_hien_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hanh_dong` enum('CREATE','UPDATE','DELETE','RESTORE','LOGIN','LOGOUT','REGISTER','PASSWORD_CHANGE','PASSWORD_RESET','ASSIGN','APPROVE','REJECT','COMPLETE','CANCEL','EXPORT','IMPORT','SYSTEM') COLLATE utf8mb4_unicode_ci NOT NULL,
  `doi_tuong` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doi_tuong` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `du_lieu_cu` json DEFAULT NULL,
  `du_lieu_moi` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endpoint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nhat_ky_su_dung`
--

CREATE TABLE `nhat_ky_su_dung` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_tai_san` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_nguoi_muon` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_muon` datetime(3) NOT NULL,
  `ngay_tra_du_kien` datetime(3) DEFAULT NULL,
  `ngay_tra_thuc_te` datetime(3) DEFAULT NULL,
  `tinh_trang_khi_tra` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nha_cung_cap`
--

CREATE TABLE `nha_cung_cap` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_ncc` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ten_nha_cung_cap` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nguoi_lien_he` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_chi` text COLLATE utf8mb4_unicode_ci,
  `ma_so_thue` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_tai_khoan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngan_hang` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nhom_san_pham`
--

CREATE TABLE `nhom_san_pham` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ten_nhom` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `thu_tu` int NOT NULL DEFAULT '0',
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nhom_san_pham`
--

INSERT INTO `nhom_san_pham` (`id`, `id_doanh_nghiep`, `ten_nhom`, `mo_ta`, `thu_tu`, `trang_thai`, `ngay_tao`, `nguoi_tao_id`, `ngay_cap_nhat`, `nguoi_cap_nhat_id`, `ngay_xoa`) VALUES
('01c66b05-6815-432b-aa7a-d2029dfa22e2', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'Dịch vụ Máy giặt', 'Vệ sinh, sửa chữa máy giặt', 0, 1, '2026-01-06 20:06:29.332', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.332', NULL, NULL),
('b12354eb-9bd6-4dd2-b0a5-4ba39066ef84', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'Dịch vụ Máy lạnh', 'Vệ sinh, sửa chữa máy lạnh', 0, 1, '2026-01-06 20:06:29.330', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.330', NULL, NULL),
('d6f0a952-7335-4ccf-9b17-612f753c9808', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'Linh kiện thay thế', 'Gas, tụ, bo mạch...', 0, 1, '2026-01-06 20:06:29.335', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.335', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `phan_cong`
--

CREATE TABLE `phan_cong` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_cong_viec` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_nguoi_dung` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `la_truong_nhom` tinyint NOT NULL DEFAULT '0',
  `trang_thai` tinyint NOT NULL DEFAULT '0',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `phieu_thu_chi`
--

CREATE TABLE `phieu_thu_chi` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_cong_viec` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_nguoi_dung` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_khach_hang` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_phieu` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai_phieu` enum('thu','chi') COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_tien` decimal(19,4) NOT NULL,
  `phuong_thuc` enum('tien_mat','chuyen_khoan','the') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'tien_mat',
  `ly_do` text COLLATE utf8mb4_unicode_ci,
  `danh_muc` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_thuc_hien` date DEFAULT NULL,
  `anh_chung_tu` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refresh_token`
--

CREATE TABLE `refresh_token` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nguoi_dung_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ngay_het_han` datetime(3) NOT NULL,
  `da_revoke` tinyint(1) NOT NULL DEFAULT '0',
  `device_info` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `san_pham`
--

CREATE TABLE `san_pham` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_nhom_san_pham` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_san_pham` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ten_san_pham` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai_san_pham` enum('HANG_HOA','DICH_VU','COMBO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HANG_HOA',
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `gia_ban` decimal(15,2) NOT NULL DEFAULT '0.00',
  `gia_von` decimal(15,2) NOT NULL DEFAULT '0.00',
  `don_vi_tinh` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hinh_anh` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `san_pham`
--

INSERT INTO `san_pham` (`id`, `id_doanh_nghiep`, `id_nhom_san_pham`, `ma_san_pham`, `ten_san_pham`, `loai_san_pham`, `mo_ta`, `gia_ban`, `gia_von`, `don_vi_tinh`, `hinh_anh`, `trang_thai`, `ngay_tao`, `nguoi_tao_id`, `ngay_cap_nhat`, `nguoi_cap_nhat_id`, `ngay_xoa`) VALUES
('55674838-690b-478a-ac98-f63eeb722d55', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'b12354eb-9bd6-4dd2-b0a5-4ba39066ef84', 'SP-1767729989343-635', 'Vệ sinh máy lạnh âm trần', 'DICH_VU', NULL, 350000.00, 30000.00, 'Bộ', NULL, 1, '2026-01-06 20:06:29.344', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.344', NULL, NULL),
('a67c4cf7-7787-4e7c-9faf-9c3b016d88b4', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'd6f0a952-7335-4ccf-9b17-612f753c9808', 'SP-1767729989347-333', 'Gas R32 (Nạp bổ sung)', 'HANG_HOA', NULL, 200000.00, 80000.00, 'PSI', NULL, 1, '2026-01-06 20:06:29.348', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.348', NULL, NULL),
('b48e9856-db0d-4fd2-a364-870a322da70b', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'b12354eb-9bd6-4dd2-b0a5-4ba39066ef84', 'SP-1767729989338-103', 'Vệ sinh máy lạnh treo tường', 'DICH_VU', NULL, 150000.00, 20000.00, 'Bộ', NULL, 1, '2026-01-06 20:06:29.339', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.339', NULL, NULL),
('bcb71f61-adce-4622-b17d-0a49c964f24e', 'c5cd291f-560c-4e58-bff9-3edc13435cc0', 'b12354eb-9bd6-4dd2-b0a5-4ba39066ef84', 'SP-1767729989350-587', 'Combo Vệ sinh + Nạp Gas', 'COMBO', NULL, 300000.00, 90000.00, 'Gói', NULL, 1, '2026-01-06 20:06:29.351', 'cb01ca04-3b0a-4d31-b36f-c1a9749bded3', '2026-01-06 20:06:29.351', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tai_khoan_khach`
--

CREATE TABLE `tai_khoan_khach` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_khach_hang` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `lan_dang_nhap_cuoi` datetime(3) DEFAULT NULL,
  `token_reset` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tai_san`
--

CREATE TABLE `tai_san` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_tai_san` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ten_tai_san` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_seri` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai_tai_san` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_mua` date DEFAULT NULL,
  `gia_mua` decimal(19,4) DEFAULT NULL,
  `nha_cung_cap` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thoi_han_bao_hanh` date DEFAULT NULL,
  `vi_tri_hien_tai` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '1',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thanh_toan_saas`
--

CREATE TABLE `thanh_toan_saas` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ma_hoa_don` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_tien` decimal(19,4) NOT NULL,
  `loai_tien` char(3) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'VND',
  `goi_cuoc` enum('trial','basic','pro','enterprise') COLLATE utf8mb4_unicode_ci NOT NULL,
  `chu_ky` enum('thang','quy','nam') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'thang',
  `tu_ngay` date NOT NULL,
  `den_ngay` date NOT NULL,
  `phuong_thuc` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_giao_dich_cong` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` tinyint NOT NULL DEFAULT '0',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_thanh_toan` datetime(3) DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `thong_bao`
--

CREATE TABLE `thong_bao` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_nguoi_nhan` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tieu_de` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci,
  `loai_thong_bao` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_doi_tuong_lien_quan` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loai_doi_tuong` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `da_xem` tinyint NOT NULL DEFAULT '0',
  `ngay_xem` datetime(3) DEFAULT NULL,
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ton_kho`
--

CREATE TABLE `ton_kho` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_doanh_nghiep` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_kho` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_san_pham` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_luong` int NOT NULL DEFAULT '0',
  `so_luong_dat_truoc` int NOT NULL DEFAULT '0',
  `ngay_tao` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ngay_cap_nhat` datetime(3) NOT NULL,
  `ngay_xoa` datetime(3) DEFAULT NULL,
  `nguoi_tao_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_cap_nhat_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bao_gia`
--
ALTER TABLE `bao_gia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bao_gia_trang_thai_idx` (`trang_thai`),
  ADD KEY `bao_gia_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `bao_gia_id_khach_hang_fkey` (`id_khach_hang`);

--
-- Indexes for table `ca_lam_viec`
--
ALTER TABLE `ca_lam_viec`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ca_lam_viec_id_doanh_nghiep_fkey` (`id_doanh_nghiep`);

--
-- Indexes for table `cham_cong`
--
ALTER TABLE `cham_cong`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cham_cong_id_nguoi_dung_ngay_lam_viec_key` (`id_nguoi_dung`,`ngay_lam_viec`),
  ADD KEY `cham_cong_ngay_lam_viec_idx` (`ngay_lam_viec`),
  ADD KEY `cham_cong_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `cham_cong_id_ca_lam_viec_fkey` (`id_ca_lam_viec`);

--
-- Indexes for table `chi_tiet_bao_gia`
--
ALTER TABLE `chi_tiet_bao_gia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chi_tiet_bao_gia_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `chi_tiet_bao_gia_id_bao_gia_fkey` (`id_bao_gia`),
  ADD KEY `chi_tiet_bao_gia_id_san_pham_fkey` (`id_san_pham`);

--
-- Indexes for table `chi_tiet_don_dat_hang`
--
ALTER TABLE `chi_tiet_don_dat_hang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chi_tiet_don_dat_hang_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `chi_tiet_don_dat_hang_id_don_dat_hang_fkey` (`id_don_dat_hang`),
  ADD KEY `chi_tiet_don_dat_hang_id_san_pham_fkey` (`id_san_pham`);

--
-- Indexes for table `cong_viec`
--
ALTER TABLE `cong_viec`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cong_viec_trang_thai_idx` (`trang_thai`),
  ADD KEY `cong_viec_ngay_hen_idx` (`ngay_hen`),
  ADD KEY `cong_viec_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `cong_viec_id_khach_hang_fkey` (`id_khach_hang`);

--
-- Indexes for table `danh_gia`
--
ALTER TABLE `danh_gia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `danh_gia_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `danh_gia_id_cong_viec_fkey` (`id_cong_viec`),
  ADD KEY `danh_gia_id_khach_hang_fkey` (`id_khach_hang`);

--
-- Indexes for table `diem_dung`
--
ALTER TABLE `diem_dung`
  ADD PRIMARY KEY (`id`),
  ADD KEY `diem_dung_thu_tu_idx` (`thu_tu`),
  ADD KEY `diem_dung_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `diem_dung_id_lo_trinh_fkey` (`id_lo_trinh`),
  ADD KEY `diem_dung_id_cong_viec_fkey` (`id_cong_viec`);

--
-- Indexes for table `doanh_nghiep`
--
ALTER TABLE `doanh_nghiep`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `doanh_nghiep_ma_doanh_nghiep_key` (`ma_doanh_nghiep`);

--
-- Indexes for table `don_dat_hang_ncc`
--
ALTER TABLE `don_dat_hang_ncc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `don_dat_hang_ncc_trang_thai_idx` (`trang_thai`),
  ADD KEY `don_dat_hang_ncc_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `don_dat_hang_ncc_id_nha_cung_cap_fkey` (`id_nha_cung_cap`),
  ADD KEY `don_dat_hang_ncc_id_kho_fkey` (`id_kho`);

--
-- Indexes for table `hop_dong`
--
ALTER TABLE `hop_dong`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hop_dong_trang_thai_idx` (`trang_thai`),
  ADD KEY `hop_dong_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `hop_dong_id_khach_hang_fkey` (`id_khach_hang`),
  ADD KEY `hop_dong_id_bao_gia_fkey` (`id_bao_gia`);

--
-- Indexes for table `khach_hang`
--
ALTER TABLE `khach_hang`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `khach_hang_ma_khach_hang_id_doanh_nghiep_key` (`ma_khach_hang`,`id_doanh_nghiep`),
  ADD KEY `khach_hang_id_doanh_nghiep_idx` (`id_doanh_nghiep`),
  ADD KEY `khach_hang_ho_ten_idx` (`ho_ten`),
  ADD KEY `khach_hang_so_dien_thoai_idx` (`so_dien_thoai`);

--
-- Indexes for table `kho`
--
ALTER TABLE `kho`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kho_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `kho_id_nguoi_phu_trach_fkey` (`id_nguoi_phu_trach`);

--
-- Indexes for table `lich_su_kho`
--
ALTER TABLE `lich_su_kho`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lich_su_kho_loai_phieu_idx` (`loai_phieu`),
  ADD KEY `lich_su_kho_ngay_tao_idx` (`ngay_tao`),
  ADD KEY `lich_su_kho_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `lich_su_kho_id_kho_fkey` (`id_kho`),
  ADD KEY `lich_su_kho_id_kho_den_fkey` (`id_kho_den`),
  ADD KEY `lich_su_kho_id_san_pham_fkey` (`id_san_pham`),
  ADD KEY `lich_su_kho_id_cong_viec_fkey` (`id_cong_viec`);

--
-- Indexes for table `lo_trinh`
--
ALTER TABLE `lo_trinh`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lo_trinh_ngay_lo_trinh_idx` (`ngay_lo_trinh`),
  ADD KEY `lo_trinh_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `lo_trinh_id_nguoi_dung_fkey` (`id_nguoi_dung`);

--
-- Indexes for table `nghiem_thu_hinh_anh`
--
ALTER TABLE `nghiem_thu_hinh_anh`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nghiem_thu_hinh_anh_loai_anh_idx` (`loai_anh`),
  ADD KEY `nghiem_thu_hinh_anh_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `nghiem_thu_hinh_anh_id_cong_viec_fkey` (`id_cong_viec`);

--
-- Indexes for table `nguoi_dung`
--
ALTER TABLE `nguoi_dung`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nguoi_dung_id_doanh_nghiep_email_key` (`id_doanh_nghiep`,`email`),
  ADD KEY `nguoi_dung_vai_tro_idx` (`vai_tro`);

--
-- Indexes for table `nhat_ky_hoat_dong`
--
ALTER TABLE `nhat_ky_hoat_dong`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nhat_ky_hoat_dong_id_doanh_nghiep_idx` (`id_doanh_nghiep`),
  ADD KEY `nhat_ky_hoat_dong_nguoi_thuc_hien_id_idx` (`nguoi_thuc_hien_id`),
  ADD KEY `nhat_ky_hoat_dong_hanh_dong_idx` (`hanh_dong`),
  ADD KEY `nhat_ky_hoat_dong_doi_tuong_idx` (`doi_tuong`),
  ADD KEY `nhat_ky_hoat_dong_ngay_tao_idx` (`ngay_tao`);

--
-- Indexes for table `nhat_ky_su_dung`
--
ALTER TABLE `nhat_ky_su_dung`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nhat_ky_su_dung_ngay_muon_idx` (`ngay_muon`),
  ADD KEY `nhat_ky_su_dung_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `nhat_ky_su_dung_id_tai_san_fkey` (`id_tai_san`),
  ADD KEY `nhat_ky_su_dung_id_nguoi_muon_fkey` (`id_nguoi_muon`);

--
-- Indexes for table `nha_cung_cap`
--
ALTER TABLE `nha_cung_cap`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nha_cung_cap_ten_nha_cung_cap_idx` (`ten_nha_cung_cap`),
  ADD KEY `nha_cung_cap_id_doanh_nghiep_fkey` (`id_doanh_nghiep`);

--
-- Indexes for table `nhom_san_pham`
--
ALTER TABLE `nhom_san_pham`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nhom_san_pham_id_doanh_nghiep_idx` (`id_doanh_nghiep`),
  ADD KEY `nhom_san_pham_ten_nhom_idx` (`ten_nhom`);

--
-- Indexes for table `phan_cong`
--
ALTER TABLE `phan_cong`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phan_cong_id_cong_viec_id_nguoi_dung_key` (`id_cong_viec`,`id_nguoi_dung`),
  ADD KEY `phan_cong_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `phan_cong_id_nguoi_dung_fkey` (`id_nguoi_dung`);

--
-- Indexes for table `phieu_thu_chi`
--
ALTER TABLE `phieu_thu_chi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `phieu_thu_chi_loai_phieu_idx` (`loai_phieu`),
  ADD KEY `phieu_thu_chi_ngay_thuc_hien_idx` (`ngay_thuc_hien`),
  ADD KEY `phieu_thu_chi_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `phieu_thu_chi_id_cong_viec_fkey` (`id_cong_viec`),
  ADD KEY `phieu_thu_chi_id_nguoi_dung_fkey` (`id_nguoi_dung`),
  ADD KEY `phieu_thu_chi_id_khach_hang_fkey` (`id_khach_hang`);

--
-- Indexes for table `refresh_token`
--
ALTER TABLE `refresh_token`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `refresh_token_token_key` (`token`),
  ADD KEY `refresh_token_nguoi_dung_id_idx` (`nguoi_dung_id`),
  ADD KEY `refresh_token_ngay_het_han_idx` (`ngay_het_han`),
  ADD KEY `refresh_token_da_revoke_idx` (`da_revoke`),
  ADD KEY `refresh_token_id_doanh_nghiep_fkey` (`id_doanh_nghiep`);

--
-- Indexes for table `san_pham`
--
ALTER TABLE `san_pham`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `san_pham_ma_san_pham_id_doanh_nghiep_key` (`ma_san_pham`,`id_doanh_nghiep`),
  ADD KEY `san_pham_id_doanh_nghiep_idx` (`id_doanh_nghiep`),
  ADD KEY `san_pham_id_nhom_san_pham_idx` (`id_nhom_san_pham`),
  ADD KEY `san_pham_ten_san_pham_idx` (`ten_san_pham`),
  ADD KEY `san_pham_loai_san_pham_idx` (`loai_san_pham`);

--
-- Indexes for table `tai_khoan_khach`
--
ALTER TABLE `tai_khoan_khach`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tai_khoan_khach_id_doanh_nghiep_email_key` (`id_doanh_nghiep`,`email`),
  ADD KEY `tai_khoan_khach_id_khach_hang_fkey` (`id_khach_hang`);

--
-- Indexes for table `tai_san`
--
ALTER TABLE `tai_san`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tai_san_ma_seri_idx` (`ma_seri`),
  ADD KEY `tai_san_id_doanh_nghiep_fkey` (`id_doanh_nghiep`);

--
-- Indexes for table `thanh_toan_saas`
--
ALTER TABLE `thanh_toan_saas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `thanh_toan_saas_id_doanh_nghiep_idx` (`id_doanh_nghiep`),
  ADD KEY `thanh_toan_saas_trang_thai_idx` (`trang_thai`),
  ADD KEY `thanh_toan_saas_tu_ngay_den_ngay_idx` (`tu_ngay`,`den_ngay`);

--
-- Indexes for table `thong_bao`
--
ALTER TABLE `thong_bao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `thong_bao_id_nguoi_nhan_idx` (`id_nguoi_nhan`),
  ADD KEY `thong_bao_da_xem_idx` (`da_xem`),
  ADD KEY `thong_bao_loai_thong_bao_idx` (`loai_thong_bao`),
  ADD KEY `thong_bao_id_doanh_nghiep_fkey` (`id_doanh_nghiep`);

--
-- Indexes for table `ton_kho`
--
ALTER TABLE `ton_kho`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ton_kho_id_kho_id_san_pham_key` (`id_kho`,`id_san_pham`),
  ADD KEY `ton_kho_id_doanh_nghiep_fkey` (`id_doanh_nghiep`),
  ADD KEY `ton_kho_id_san_pham_fkey` (`id_san_pham`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bao_gia`
--
ALTER TABLE `bao_gia`
  ADD CONSTRAINT `bao_gia_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `bao_gia_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ca_lam_viec`
--
ALTER TABLE `ca_lam_viec`
  ADD CONSTRAINT `ca_lam_viec_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `cham_cong`
--
ALTER TABLE `cham_cong`
  ADD CONSTRAINT `cham_cong_id_ca_lam_viec_fkey` FOREIGN KEY (`id_ca_lam_viec`) REFERENCES `ca_lam_viec` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `cham_cong_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cham_cong_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `chi_tiet_bao_gia`
--
ALTER TABLE `chi_tiet_bao_gia`
  ADD CONSTRAINT `chi_tiet_bao_gia_id_bao_gia_fkey` FOREIGN KEY (`id_bao_gia`) REFERENCES `bao_gia` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `chi_tiet_bao_gia_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `chi_tiet_bao_gia_id_san_pham_fkey` FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `chi_tiet_don_dat_hang`
--
ALTER TABLE `chi_tiet_don_dat_hang`
  ADD CONSTRAINT `chi_tiet_don_dat_hang_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `chi_tiet_don_dat_hang_id_don_dat_hang_fkey` FOREIGN KEY (`id_don_dat_hang`) REFERENCES `don_dat_hang_ncc` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `chi_tiet_don_dat_hang_id_san_pham_fkey` FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `cong_viec`
--
ALTER TABLE `cong_viec`
  ADD CONSTRAINT `cong_viec_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `cong_viec_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `danh_gia`
--
ALTER TABLE `danh_gia`
  ADD CONSTRAINT `danh_gia_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `danh_gia_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `danh_gia_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `diem_dung`
--
ALTER TABLE `diem_dung`
  ADD CONSTRAINT `diem_dung_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `diem_dung_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `diem_dung_id_lo_trinh_fkey` FOREIGN KEY (`id_lo_trinh`) REFERENCES `lo_trinh` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `don_dat_hang_ncc`
--
ALTER TABLE `don_dat_hang_ncc`
  ADD CONSTRAINT `don_dat_hang_ncc_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `don_dat_hang_ncc_id_kho_fkey` FOREIGN KEY (`id_kho`) REFERENCES `kho` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `don_dat_hang_ncc_id_nha_cung_cap_fkey` FOREIGN KEY (`id_nha_cung_cap`) REFERENCES `nha_cung_cap` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `hop_dong`
--
ALTER TABLE `hop_dong`
  ADD CONSTRAINT `hop_dong_id_bao_gia_fkey` FOREIGN KEY (`id_bao_gia`) REFERENCES `bao_gia` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `hop_dong_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `hop_dong_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `khach_hang`
--
ALTER TABLE `khach_hang`
  ADD CONSTRAINT `khach_hang_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `kho`
--
ALTER TABLE `kho`
  ADD CONSTRAINT `kho_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `kho_id_nguoi_phu_trach_fkey` FOREIGN KEY (`id_nguoi_phu_trach`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `lich_su_kho`
--
ALTER TABLE `lich_su_kho`
  ADD CONSTRAINT `lich_su_kho_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `lich_su_kho_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `lich_su_kho_id_kho_den_fkey` FOREIGN KEY (`id_kho_den`) REFERENCES `kho` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `lich_su_kho_id_kho_fkey` FOREIGN KEY (`id_kho`) REFERENCES `kho` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `lich_su_kho_id_san_pham_fkey` FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `lo_trinh`
--
ALTER TABLE `lo_trinh`
  ADD CONSTRAINT `lo_trinh_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `lo_trinh_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `nghiem_thu_hinh_anh`
--
ALTER TABLE `nghiem_thu_hinh_anh`
  ADD CONSTRAINT `nghiem_thu_hinh_anh_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `nghiem_thu_hinh_anh_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `nguoi_dung`
--
ALTER TABLE `nguoi_dung`
  ADD CONSTRAINT `nguoi_dung_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `nhat_ky_hoat_dong`
--
ALTER TABLE `nhat_ky_hoat_dong`
  ADD CONSTRAINT `nhat_ky_hoat_dong_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `nhat_ky_hoat_dong_nguoi_thuc_hien_id_fkey` FOREIGN KEY (`nguoi_thuc_hien_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `nhat_ky_su_dung`
--
ALTER TABLE `nhat_ky_su_dung`
  ADD CONSTRAINT `nhat_ky_su_dung_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `nhat_ky_su_dung_id_nguoi_muon_fkey` FOREIGN KEY (`id_nguoi_muon`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `nhat_ky_su_dung_id_tai_san_fkey` FOREIGN KEY (`id_tai_san`) REFERENCES `tai_san` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `nha_cung_cap`
--
ALTER TABLE `nha_cung_cap`
  ADD CONSTRAINT `nha_cung_cap_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `nhom_san_pham`
--
ALTER TABLE `nhom_san_pham`
  ADD CONSTRAINT `nhom_san_pham_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `phan_cong`
--
ALTER TABLE `phan_cong`
  ADD CONSTRAINT `phan_cong_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `phan_cong_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `phan_cong_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `phieu_thu_chi`
--
ALTER TABLE `phieu_thu_chi`
  ADD CONSTRAINT `phieu_thu_chi_id_cong_viec_fkey` FOREIGN KEY (`id_cong_viec`) REFERENCES `cong_viec` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `phieu_thu_chi_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `phieu_thu_chi_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `phieu_thu_chi_id_nguoi_dung_fkey` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `refresh_token`
--
ALTER TABLE `refresh_token`
  ADD CONSTRAINT `refresh_token_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `refresh_token_nguoi_dung_id_fkey` FOREIGN KEY (`nguoi_dung_id`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `san_pham`
--
ALTER TABLE `san_pham`
  ADD CONSTRAINT `san_pham_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `san_pham_id_nhom_san_pham_fkey` FOREIGN KEY (`id_nhom_san_pham`) REFERENCES `nhom_san_pham` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `tai_khoan_khach`
--
ALTER TABLE `tai_khoan_khach`
  ADD CONSTRAINT `tai_khoan_khach_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tai_khoan_khach_id_khach_hang_fkey` FOREIGN KEY (`id_khach_hang`) REFERENCES `khach_hang` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tai_san`
--
ALTER TABLE `tai_san`
  ADD CONSTRAINT `tai_san_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `thanh_toan_saas`
--
ALTER TABLE `thanh_toan_saas`
  ADD CONSTRAINT `thanh_toan_saas_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `thong_bao`
--
ALTER TABLE `thong_bao`
  ADD CONSTRAINT `thong_bao_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `thong_bao_id_nguoi_nhan_fkey` FOREIGN KEY (`id_nguoi_nhan`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ton_kho`
--
ALTER TABLE `ton_kho`
  ADD CONSTRAINT `ton_kho_id_doanh_nghiep_fkey` FOREIGN KEY (`id_doanh_nghiep`) REFERENCES `doanh_nghiep` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ton_kho_id_kho_fkey` FOREIGN KEY (`id_kho`) REFERENCES `kho` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ton_kho_id_san_pham_fkey` FOREIGN KEY (`id_san_pham`) REFERENCES `san_pham` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
