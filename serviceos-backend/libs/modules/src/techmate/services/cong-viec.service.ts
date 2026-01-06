import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CongViecService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: { trang_thai?: number; page?: number; limit?: number }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (filters?.trang_thai !== undefined) {
            where.trang_thai = filters.trang_thai;
        }

        const [data, total] = await Promise.all([
            this.prisma.congViec.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
                include: {
                    khach_hang: { select: { id: true, ho_ten: true, so_dien_thoai: true } },
                    phan_cong: { include: { nguoi_dung: { select: { id: true, ho_ten: true } } } },
                },
            }),
            this.prisma.congViec.count({ where }),
        ]);

        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async findOne(id: string) {
        const job = await this.prisma.congViec.findFirst({
            where: { id },
            include: {
                khach_hang: true,
                phan_cong: { include: { nguoi_dung: true } },
                nghiem_thu_hinh_anh: true,
            },
        });
        if (!job) throw new NotFoundException('Không tìm thấy công việc');
        return job;
    }

    async create(data: any) {
        return this.prisma.congViec.create({
            data: { id: uuidv4(), ...data },
        });
    }

    async update(id: string, data: any) {
        return this.prisma.congViec.update({ where: { id }, data });
    }

    async updateStatus(id: string, trang_thai: number) {
        const updateData: any = { trang_thai };
        if (trang_thai === 3) updateData.ngay_hoan_thanh = new Date();
        return this.prisma.congViec.update({ where: { id }, data: updateData });
    }

    async remove(id: string) {
        return this.prisma.congViec.delete({ where: { id } });
    }
}
