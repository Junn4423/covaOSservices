/**
 * ============================================================
 * PHÂN CÔNG SERVICE - TechMate Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Logic nghiệp vụ quản lý Phân công (Assignments):
 * - assignStaff: Phân công nhân viên vào công việc
 * - removeStaff: Gỡ nhân viên khỏi công việc
 * - getByJob: Lấy danh sách phân công theo công việc
 * - getByUser: Lấy danh sách phân công theo user
 * - updateAssignment: Cập nhật thông tin phân công
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import {
    AssignStaffDto,
    UpdatePhanCongDto,
    TrangThaiPhanCong,
} from '../dto/phan-cong.dto';

@Injectable()
export class PhanCongService {
    constructor(private prisma: PrismaService) { }

    // ============================================================
    // ASSIGN STAFF - Phân công nhân viên vào công việc
    // ============================================================
    /**
     * Phân công nhân viên vào công việc
     * - Validate: Không phân công trùng lặp
     * - Validate: Công việc và nhân viên phải tồn tại
     * - Validate: Cùng tenant (doanh nghiệp)
     */
    async assignStaff(
        jobId: string,
        dto: AssignStaffDto,
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

        // Validate nhân viên tồn tại và cùng tenant
        const nguoiDung = await this.prisma.nguoiDung.findFirst({
            where: {
                id: dto.id_nguoi_dung,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
                trang_thai: 1, // Active
            },
        });

        if (!nguoiDung) {
            throw new NotFoundException('Không tìm thấy nhân viên hoặc nhân viên đã bị vô hiệu hóa');
        }

        // Check trùng lặp phân công
        const existingAssignment = await this.prisma.phanCong.findFirst({
            where: {
                id_cong_viec: jobId,
                id_nguoi_dung: dto.id_nguoi_dung,
                ngay_xoa: null,
            },
        });

        if (existingAssignment) {
            throw new ConflictException('Nhân viên này đã được phân công vào công việc');
        }

        // Nếu đặt làm trưởng nhóm, kiểm tra đã có trưởng nhóm chưa
        if (dto.la_truong_nhom) {
            const existingLeader = await this.prisma.phanCong.findFirst({
                where: {
                    id_cong_viec: jobId,
                    la_truong_nhom: 1,
                    ngay_xoa: null,
                },
            });

            if (existingLeader) {
                throw new ConflictException('Công việc đã có trưởng nhóm. Vui lòng gỡ trưởng nhóm cũ trước.');
            }
        }

        // Tạo phân công
        const phanCong = await this.prisma.phanCong.create({
            data: {
                id: uuidv4(),
                id_doanh_nghiep: tenantId,
                id_cong_viec: jobId,
                id_nguoi_dung: dto.id_nguoi_dung,
                la_truong_nhom: dto.la_truong_nhom ? 1 : 0,
                trang_thai: TrangThaiPhanCong.CHUA_NHAN,
                ghi_chu: dto.ghi_chu,
                nguoi_tao_id: userId,
            },
            include: {
                nguoi_dung: {
                    select: {
                        id: true,
                        ho_ten: true,
                        so_dien_thoai: true,
                        anh_dai_dien: true,
                        vai_tro: true,
                    },
                },
                cong_viec: {
                    select: {
                        id: true,
                        ma_cong_viec: true,
                        tieu_de: true,
                    },
                },
            },
        });

        return phanCong;
    }

    // ============================================================
    // REMOVE STAFF - Gỡ nhân viên khỏi công việc
    // ============================================================
    /**
     * Gỡ nhân viên khỏi công việc (soft delete)
     */
    async removeStaff(
        jobId: string,
        staffId: string,
        userId: string,
        tenantId: string,
    ) {
        const phanCong = await this.prisma.phanCong.findFirst({
            where: {
                id_cong_viec: jobId,
                id_nguoi_dung: staffId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!phanCong) {
            throw new NotFoundException('Không tìm thấy phân công');
        }

        return this.prisma.phanCong.update({
            where: { id: phanCong.id },
            data: {
                ngay_xoa: new Date(),
                nguoi_cap_nhat_id: userId,
            },
        });
    }

    // ============================================================
    // UPDATE ASSIGNMENT - Cập nhật phân công
    // ============================================================
    async updateAssignment(
        assignmentId: string,
        dto: UpdatePhanCongDto,
        userId: string,
        tenantId: string,
    ) {
        const phanCong = await this.prisma.phanCong.findFirst({
            where: {
                id: assignmentId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!phanCong) {
            throw new NotFoundException('Không tìm thấy phân công');
        }

        // Nếu cập nhật thành trưởng nhóm
        if (dto.la_truong_nhom === true) {
            // Gỡ trưởng nhóm cũ (nếu có)
            await this.prisma.phanCong.updateMany({
                where: {
                    id_cong_viec: phanCong.id_cong_viec,
                    la_truong_nhom: 1,
                    ngay_xoa: null,
                    id: { not: assignmentId },
                },
                data: {
                    la_truong_nhom: 0,
                    nguoi_cap_nhat_id: userId,
                },
            });
        }

        return this.prisma.phanCong.update({
            where: { id: assignmentId },
            data: {
                la_truong_nhom: dto.la_truong_nhom !== undefined
                    ? (dto.la_truong_nhom ? 1 : 0)
                    : undefined,
                trang_thai: dto.trang_thai,
                ghi_chu: dto.ghi_chu,
                nguoi_cap_nhat_id: userId,
            },
            include: {
                nguoi_dung: {
                    select: {
                        id: true,
                        ho_ten: true,
                        so_dien_thoai: true,
                    },
                },
            },
        });
    }

    // ============================================================
    // GET BY JOB - Lấy danh sách phân công theo công việc
    // ============================================================
    async getByJob(jobId: string, tenantId: string) {
        const phanCongList = await this.prisma.phanCong.findMany({
            where: {
                id_cong_viec: jobId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
            include: {
                nguoi_dung: {
                    select: {
                        id: true,
                        ho_ten: true,
                        so_dien_thoai: true,
                        anh_dai_dien: true,
                        vai_tro: true,
                    },
                },
            },
            orderBy: [
                { la_truong_nhom: 'desc' }, // Trưởng nhóm trước
                { ngay_tao: 'asc' },
            ],
        });

        return {
            data: phanCongList,
            total: phanCongList.length,
        };
    }

    // ============================================================
    // GET BY USER - Lấy danh sách công việc theo user
    // ============================================================
    async getByUser(staffId: string, tenantId: string) {
        const phanCongList = await this.prisma.phanCong.findMany({
            where: {
                id_nguoi_dung: staffId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
            include: {
                cong_viec: {
                    include: {
                        khach_hang: {
                            select: {
                                id: true,
                                ho_ten: true,
                                so_dien_thoai: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                cong_viec: {
                    ngay_hen: 'asc',
                },
            },
        });

        return {
            data: phanCongList,
            total: phanCongList.length,
        };
    }

    // ============================================================
    // ACCEPT JOB - Nhân viên nhận việc (Mobile API)
    // ============================================================
    async acceptJob(jobId: string, userId: string, tenantId: string) {
        const phanCong = await this.prisma.phanCong.findFirst({
            where: {
                id_cong_viec: jobId,
                id_nguoi_dung: userId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!phanCong) {
            throw new NotFoundException('Bạn không được phân công vào công việc này');
        }

        if (phanCong.trang_thai !== TrangThaiPhanCong.CHUA_NHAN) {
            throw new BadRequestException('Bạn đã nhận công việc này rồi');
        }

        return this.prisma.phanCong.update({
            where: { id: phanCong.id },
            data: {
                trang_thai: TrangThaiPhanCong.DA_NHAN,
                nguoi_cap_nhat_id: userId,
            },
            include: {
                cong_viec: true,
            },
        });
    }

    // ============================================================
    // START JOB - Bắt đầu làm (Mobile API)
    // ============================================================
    async startJob(jobId: string, userId: string, tenantId: string) {
        const phanCong = await this.prisma.phanCong.findFirst({
            where: {
                id_cong_viec: jobId,
                id_nguoi_dung: userId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!phanCong) {
            throw new NotFoundException('Bạn không được phân công vào công việc này');
        }

        if (phanCong.trang_thai === TrangThaiPhanCong.CHUA_NHAN) {
            throw new BadRequestException('Bạn cần nhận công việc trước');
        }

        return this.prisma.phanCong.update({
            where: { id: phanCong.id },
            data: {
                trang_thai: TrangThaiPhanCong.DANG_LAM,
                nguoi_cap_nhat_id: userId,
            },
        });
    }

    // ============================================================
    // COMPLETE MY PART - Hoàn thành phần việc (Mobile API)
    // ============================================================
    async completeMyPart(jobId: string, userId: string, tenantId: string) {
        const phanCong = await this.prisma.phanCong.findFirst({
            where: {
                id_cong_viec: jobId,
                id_nguoi_dung: userId,
                id_doanh_nghiep: tenantId,
                ngay_xoa: null,
            },
        });

        if (!phanCong) {
            throw new NotFoundException('Bạn không được phân công vào công việc này');
        }

        return this.prisma.phanCong.update({
            where: { id: phanCong.id },
            data: {
                trang_thai: TrangThaiPhanCong.HOAN_THANH,
                nguoi_cap_nhat_id: userId,
            },
        });
    }
}
