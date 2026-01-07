/**
 * ============================================================
 * PRISMA SEED - ServiceOS
 * Dữ liệu mẫu cho development
 * ============================================================
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Bắt đầu seed dữ liệu...');

    // 1. Tạo Doanh nghiệp mẫu
    const doanhNghiep = await prisma.doanhNghiep.upsert({
        where: { ma_doanh_nghiep: 'DN-DEMO-001' },
        update: {},
        create: {
            ma_doanh_nghiep: 'DN-DEMO-001',
            ten_doanh_nghiep: 'Công ty TNHH ServiceOS Demo',
            email: 'admin@serviceos-demo.vn',
            so_dien_thoai: '0901234567',
            dia_chi: '123 Nguyễn Huệ, Quận 1, TP.HCM',
            goi_cuoc: 'trial',
        },
    });
    console.log(` Doanh nghiệp: ${doanhNghiep.ten_doanh_nghiep}`);

    // 2. Tạo người dùng Admin
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const admin = await prisma.nguoiDung.upsert({
        where: {
            id_doanh_nghiep_email: {
                id_doanh_nghiep: doanhNghiep.id,
                email: 'admin@serviceos-demo.vn',
            },
        },
        update: {},
        create: {
            id_doanh_nghiep: doanhNghiep.id,
            email: 'admin@serviceos-demo.vn',
            mat_khau: hashedPassword,
            ho_ten: 'Admin Demo',
            vai_tro: 'admin',
            so_dien_thoai: '0901234567',
        },
    });
    console.log(` Người dùng Admin: ${admin.ho_ten} (${admin.email})`);

    // 3. Tạo Nhóm sản phẩm mẫu
    const nhomDichVu = await prisma.nhomSanPham.upsert({
        where: { id: 'nhom-dich-vu-demo' },
        update: {},
        create: {
            id: 'nhom-dich-vu-demo',
            id_doanh_nghiep: doanhNghiep.id,
            ten_nhom: 'Dịch vụ sửa chữa',
            mo_ta: 'Các dịch vụ sửa chữa máy lạnh, điện lạnh',
        },
    });
    console.log(` Nhóm sản phẩm: ${nhomDichVu.ten_nhom}`);

    // 4. Tạo Sản phẩm mẫu
    const sanPham1 = await prisma.sanPham.upsert({
        where: {
            ma_san_pham_id_doanh_nghiep: {
                ma_san_pham: 'DV-001',
                id_doanh_nghiep: doanhNghiep.id,
            },
        },
        update: {},
        create: {
            id_doanh_nghiep: doanhNghiep.id,
            ma_san_pham: 'DV-001',
            ten_san_pham: 'Vệ sinh máy lạnh 1HP-2HP',
            loai_san_pham: 'DICH_VU',
            gia_ban: 150000,
            gia_von: 50000,
            don_vi_tinh: 'Lần',
            id_nhom_san_pham: nhomDichVu.id,
        },
    });

    const sanPham2 = await prisma.sanPham.upsert({
        where: {
            ma_san_pham_id_doanh_nghiep: {
                ma_san_pham: 'DV-002',
                id_doanh_nghiep: doanhNghiep.id,
            },
        },
        update: {},
        create: {
            id_doanh_nghiep: doanhNghiep.id,
            ma_san_pham: 'DV-002',
            ten_san_pham: 'Bơm gas máy lạnh R22',
            loai_san_pham: 'DICH_VU',
            gia_ban: 300000,
            gia_von: 100000,
            don_vi_tinh: 'Lần',
            id_nhom_san_pham: nhomDichVu.id,
        },
    });

    const sanPham3 = await prisma.sanPham.upsert({
        where: {
            ma_san_pham_id_doanh_nghiep: {
                ma_san_pham: 'SP-001',
                id_doanh_nghiep: doanhNghiep.id,
            },
        },
        update: {},
        create: {
            id_doanh_nghiep: doanhNghiep.id,
            ma_san_pham: 'SP-001',
            ten_san_pham: 'Tụ điện máy lạnh 35uF',
            loai_san_pham: 'HANG_HOA',
            gia_ban: 120000,
            gia_von: 60000,
            don_vi_tinh: 'Cái',
        },
    });
    console.log(` Sản phẩm: ${sanPham1.ten_san_pham}, ${sanPham2.ten_san_pham}, ${sanPham3.ten_san_pham}`);

    // 5. Tạo Khách hàng mẫu
    const khachHang1 = await prisma.khachHang.upsert({
        where: {
            ma_khach_hang_id_doanh_nghiep: {
                ma_khach_hang: 'KH-001',
                id_doanh_nghiep: doanhNghiep.id,
            },
        },
        update: {},
        create: {
            id_doanh_nghiep: doanhNghiep.id,
            ma_khach_hang: 'KH-001',
            ho_ten: 'Nguyễn Văn An',
            so_dien_thoai: '0912345678',
            email: 'nguyenvanan@gmail.com',
            dia_chi: '456 Lê Lợi, Quận 1, TP.HCM',
            loai_khach: 'ca_nhan',
            nguon_khach: 'FACEBOOK',
        },
    });

    const khachHang2 = await prisma.khachHang.upsert({
        where: {
            ma_khach_hang_id_doanh_nghiep: {
                ma_khach_hang: 'KH-002',
                id_doanh_nghiep: doanhNghiep.id,
            },
        },
        update: {},
        create: {
            id_doanh_nghiep: doanhNghiep.id,
            ma_khach_hang: 'KH-002',
            ho_ten: 'Công ty ABC',
            so_dien_thoai: '0287654321',
            email: 'contact@abc.vn',
            dia_chi: '789 Nguyễn Thị Minh Khai, Quận 3, TP.HCM',
            loai_khach: 'doanh_nghiep',
            nguon_khach: 'WEBSITE',
        },
    });
    console.log(` Khách hàng: ${khachHang1.ho_ten}, ${khachHang2.ho_ten}`);

    console.log('');
    console.log('Seed dữ liệu hoàn tất!');
    console.log('');
    console.log('Thông tin đăng nhập:');
    console.log(`Email: admin@serviceos-demo.vn`);
    console.log(`Password: Admin@123`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('Lỗi seed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
