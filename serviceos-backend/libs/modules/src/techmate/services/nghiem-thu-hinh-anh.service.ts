/**
 * ============================================================
 * NGHIỆM THU HÌNH ẢNH SERVICE - TechMate Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Logic nghiệp vụ quản lý Hình ảnh nghiệm thu (Evidence):
 * - addEvidence: Thêm ảnh nghiệm thu
 * - getByJob: Lấy danh sách ảnh theo công việc
 * - deleteEvidence: Xóa ảnh
 * 
 * Lưu ý: Chỉ lưu URL string, chưa tích hợp Upload file.
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import {
    AddEvidenceDto,
    LoaiAnh,
    QueryNghiemThuHinhAnhDto,
} from '../dto/nghiem-thu-hinh-anh.dto';

@Injectable()
export class NghiemThuHinhAnhService {
    constructor(private prisma: PrismaService) { }

    // ============================================================
    // ADD EVIDENCE - Thêm ảnh nghiệm thu
    // ============================================================
    /**
     * Thêm hình ảnh nghiệm thu vào công việc
     * - Validate công việc tồn tại
     * - Lưu URL và thông tin tọa độ
     */
    async addEvidence(
        jobId: string,
        dto: AddEvidenceDto,
        userId: string,
        tenantId: string,
    ) {
        // Validate công việc tồn tại
        const congViec = await this.prisma.congViec.findFirst({
            where: {
                id: jobId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!congViec) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        // Optionally: Check if user is assigned to this job
        const isAssigned = await this.prisma.phanCong.findFirst({
            where: {
                id_cong_viec: jobId,
                id_nguoi_dung: userId,
                ngay_xoa: null,
            },
        });

        // Tạo record nghiệm thu
        const nghiemThu = await this.prisma.nghiemThuHinhAnh.create({
            data: {
                id: uuidv4(),
                id_doanh_nghiep: tenantId,
                id_cong_viec: jobId,
                url_anh: dto.url_anh,
                loai_anh: dto.loai_anh || LoaiAnh.TRUOC,
                mo_ta: dto.mo_ta,
                toa_do_lat: dto.toa_do_lat,
                toa_do_lng: dto.toa_do_lng,
                nguoi_tao_id: userId,
            },
        });

        return nghiemThu;
    }

    // ============================================================
    // BULK ADD EVIDENCE - Thêm nhiều ảnh cùng lúc
    // ============================================================
    async bulkAddEvidence(
        jobId: string,
        images: AddEvidenceDto[],
        userId: string,
        tenantId: string,
    ) {
        // Validate công việc tồn tại
        const congViec = await this.prisma.congViec.findFirst({
            where: {
                id: jobId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!congViec) {
            throw new NotFoundException('Không tìm thấy công việc');
        }

        // Prepare data
        const data = images.map((img) => ({
            id: uuidv4(),
            id_doanh_nghiep: tenantId,
            id_cong_viec: jobId,
            url_anh: img.url_anh,
            loai_anh: img.loai_anh || LoaiAnh.TRUOC,
            mo_ta: img.mo_ta,
            toa_do_lat: img.toa_do_lat,
            toa_do_lng: img.toa_do_lng,
            nguoi_tao_id: userId,
        }));

        // Bulk create
        const result = await this.prisma.nghiemThuHinhAnh.createMany({
            data,
        });

        return {
            count: result.count,
            message: `Đã thêm ${result.count} ảnh nghiệm thu`,
        };
    }

    // ============================================================
    // GET BY JOB - Lấy danh sách ảnh theo công việc
    // ============================================================
    async getByJob(
        jobId: string,
        tenantId: string,
        query?: QueryNghiemThuHinhAnhDto,
    ) {
        const where: Prisma.NghiemThuHinhAnhWhereInput = {
            id_cong_viec: jobId,
            id_doanh_nghiep: tenantId,
            ngay_xoa: null,
        };

        // Filter by loai_anh
        if (query?.loai_anh) {
            where.loai_anh = query.loai_anh;
        }

        const [images, counts] = await Promise.all([
            this.prisma.nghiemThuHinhAnh.findMany({
                where,
                orderBy: [
                    { loai_anh: 'asc' },
                    { ngay_tao: 'asc' },
                ],
            }),
            // Count by type
            this.prisma.nghiemThuHinhAnh.groupBy({
                by: ['loai_anh'],
                where: {
                    id_cong_viec: jobId,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
                _count: true,
            }),
        ]);

        // Transform counts to object
        const byType: Record<string, number> = {
            [LoaiAnh.TRUOC]: 0,
            [LoaiAnh.SAU]: 0,
            [LoaiAnh.QUA_TRINH]: 0,
        };

        counts.forEach((c) => {
            byType[c.loai_anh] = c._count;
        });

        return {
            data: images,
            total: images.length,
            by_type: byType,
        };
    }

    // ============================================================
    // GET ONE - Lấy chi tiết ảnh
    // ============================================================
    async getOne(imageId: string, tenantId: string) {
        const image = await this.prisma.nghiemThuHinhAnh.findFirst({
            where: {
                id: imageId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
            include: {
                cong_viec: {
                    select: {
                        id: true,
                        ma_cong_viec: true,
                        tieu_de: true,
                    },
                },
            },
        });

        if (!image) {
            throw new NotFoundException('Không tìm thấy hình ảnh');
        }

        return image;
    }

    // ============================================================
    // UPDATE EVIDENCE - Cập nhật thông tin ảnh
    // ============================================================
    async updateEvidence(
        imageId: string,
        dto: Partial<AddEvidenceDto>,
        userId: string,
        tenantId: string,
    ) {
        const image = await this.prisma.nghiemThuHinhAnh.findFirst({
            where: {
                id: imageId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!image) {
            throw new NotFoundException('Không tìm thấy hình ảnh');
        }

        return this.prisma.nghiemThuHinhAnh.update({
            where: { id: imageId },
            data: {
                url_anh: dto.url_anh,
                loai_anh: dto.loai_anh,
                mo_ta: dto.mo_ta,
                toa_do_lat: dto.toa_do_lat,
                toa_do_lng: dto.toa_do_lng,
                nguoi_cap_nhat_id: userId,
            },
        });
    }

    // ============================================================
    // DELETE EVIDENCE - Xóa ảnh (soft delete)
    // ============================================================
    async deleteEvidence(
        imageId: string,
        userId: string,
        tenantId: string,
    ) {
        const image = await this.prisma.nghiemThuHinhAnh.findFirst({
            where: {
                id: imageId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!image) {
            throw new NotFoundException('Không tìm thấy hình ảnh');
        }

        return this.prisma.nghiemThuHinhAnh.update({
            where: { id: imageId },
            data: {
                ngay_xoa: new Date(),
                nguoi_cap_nhat_id: userId,
            },
        });
    }

    // ============================================================
    // DELETE BY JOB - Xóa tất cả ảnh của công việc
    // ============================================================
    async deleteByJob(
        jobId: string,
        userId: string,
        tenantId: string,
    ) {
        const result = await this.prisma.nghiemThuHinhAnh.updateMany({
            where: {
                id_cong_viec: jobId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
            data: {
                ngay_xoa: new Date(),
                nguoi_cap_nhat_id: userId,
            },
        });

        return {
            count: result.count,
            message: `Đã xóa ${result.count} ảnh nghiệm thu`,
        };
    }
}
