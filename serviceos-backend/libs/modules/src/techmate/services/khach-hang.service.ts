import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KhachHangService {
    constructor(private prisma: PrismaService) { }

    async findAll(page = 1, limit = 20, search?: string) {
        const skip = (page - 1) * limit;
        const where: any = {};
        if (search) {
            where.OR = [
                { ten_khach_hang: { contains: search } },
                { so_dien_thoai: { contains: search } },
                { email: { contains: search } },
            ];
        }

        const [data, total] = await Promise.all([
            this.prisma.khachHang.findMany({ where, skip, take: limit, orderBy: { ngay_tao: 'desc' } }),
            this.prisma.khachHang.count({ where }),
        ]);

        return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    async findOne(id: string) {
        const kh = await this.prisma.khachHang.findFirst({ where: { id } });
        if (!kh) throw new NotFoundException('Không tìm thấy khách hàng');
        return kh;
    }

    async create(data: any) {
        return this.prisma.khachHang.create({ data: { id: uuidv4(), ...data } });
    }

    async update(id: string, data: any) {
        return this.prisma.khachHang.update({ where: { id }, data });
    }

    async remove(id: string) {
        return this.prisma.khachHang.delete({ where: { id } });
    }
}
