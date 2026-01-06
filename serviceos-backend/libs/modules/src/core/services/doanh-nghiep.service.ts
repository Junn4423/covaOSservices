/**
 * Doanh Nghiệp Service - Quản lý tenant
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/database';

@Injectable()
export class DoanhNghiepService {
    constructor(private prisma: PrismaService) { }

    async getProfile(tenantId: string) {
        const dn = await this.prisma.doanhNghiep.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                ten_doanh_nghiep: true,
                ma_doanh_nghiep: true,
                email: true,
                so_dien_thoai: true,
                dia_chi: true,
                logo_url: true,
                goi_cuoc: true,
                ngay_het_han_goi: true,
                trang_thai: true,
                cau_hinh_json: true,
                ngay_tao: true,
            },
        });

        if (!dn) {
            throw new NotFoundException('Không tìm thấy doanh nghiệp');
        }

        return dn;
    }

    async updateProfile(tenantId: string, data: Partial<{
        ten_doanh_nghiep: string;
        email: string;
        so_dien_thoai: string;
        dia_chi: string;
        logo_url: string;
        cau_hinh_json: any;
    }>) {
        return this.prisma.doanhNghiep.update({
            where: { id: tenantId },
            data,
            select: {
                id: true,
                ten_doanh_nghiep: true,
                email: true,
                so_dien_thoai: true,
                dia_chi: true,
                logo_url: true,
            },
        });
    }

    async getStats(tenantId: string) {
        const [
            totalUsers,
            totalCustomers,
            totalJobs,
            completedJobs,
        ] = await Promise.all([
            this.prisma.nguoiDung.count({ where: { id_doanh_nghiep: tenantId } }),
            this.prisma.khachHang.count({ where: { id_doanh_nghiep: tenantId } }),
            this.prisma.congViec.count({ where: { id_doanh_nghiep: tenantId } }),
            this.prisma.congViec.count({
                where: { id_doanh_nghiep: tenantId, trang_thai: 3 }
            }),
        ]);

        return {
            so_nhan_vien: totalUsers,
            so_khach_hang: totalCustomers,
            tong_cong_viec: totalJobs,
            cong_viec_hoan_thanh: completedJobs,
        };
    }
}
