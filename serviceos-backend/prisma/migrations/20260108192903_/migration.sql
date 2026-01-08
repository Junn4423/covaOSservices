-- CreateTable
CREATE TABLE `tap_tin` (
    `id` CHAR(36) NOT NULL,
    `id_doanh_nghiep` CHAR(36) NOT NULL,
    `nguoi_tao_id` CHAR(36) NULL,
    `ten_goc` VARCHAR(255) NOT NULL,
    `ten_luu_tru` VARCHAR(255) NOT NULL,
    `loai_tap_tin` VARCHAR(100) NOT NULL,
    `kich_thuoc` INTEGER NOT NULL,
    `bucket` VARCHAR(100) NULL,
    `duong_dan` VARCHAR(500) NULL,
    `url_cong_khai` VARCHAR(500) NULL,
    `du_lieu_base64` LONGTEXT NULL,
    `loai_doi_tuong` VARCHAR(50) NULL,
    `id_doi_tuong` CHAR(36) NULL,
    `ngay_tao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ngay_cap_nhat` DATETIME(3) NOT NULL,
    `ngay_xoa` DATETIME(3) NULL,

    INDEX `tap_tin_id_doanh_nghiep_idx`(`id_doanh_nghiep`),
    INDEX `tap_tin_loai_doi_tuong_id_doi_tuong_idx`(`loai_doi_tuong`, `id_doi_tuong`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
