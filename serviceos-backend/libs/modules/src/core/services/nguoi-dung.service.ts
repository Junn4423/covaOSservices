/**
 * Người Dùng Service - CRUD nhân viên
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@libs/database';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NguoiDungService {
    constructor(private prisma: PrismaService) { }

    async findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.nguoiDung.findMany({
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
                select: {
                    id: true,
                    email: true,
                    ho_ten: true,
                    so_dien_thoai: true,
                    vai_tro: true,
                    phong_ban: true,
                    trang_thai: true,
                    ngay_tao: true,
                },
            }),
            this.prisma.nguoiDung.count(),
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string) {
        const user = await this.prisma.nguoiDung.findFirst({
            where: { id },
            select: {
                id: true,
                email: true,
                ho_ten: true,
                so_dien_thoai: true,
                anh_dai_dien: true,
                vai_tro: true,
                phong_ban: true,
                trang_thai: true,
                ngay_tao: true,
                lan_dang_nhap_cuoi: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Không tìm thấy người dùng');
        }

        return user;
    }

    async create(data: {
        email: string;
        mat_khau: string;
        ho_ten: string;
        so_dien_thoai?: string;
        vai_tro?: string;
        phong_ban?: string;
    }) {
        const hashedPassword = await bcrypt.hash(data.mat_khau, 10);

        return this.prisma.nguoiDung.create({
            data: {
                id: uuidv4(),
                ...data,
                mat_khau: hashedPassword,
                vai_tro: (data.vai_tro as any) || 'viewer',
                trang_thai: 1,
            },
            select: {
                id: true,
                email: true,
                ho_ten: true,
                vai_tro: true,
            },
        });
    }

    async update(id: string, data: Partial<{
        ho_ten: string;
        so_dien_thoai: string;
        vai_tro: string;
        phong_ban: string;
        trang_thai: number;
    }>) {
        return this.prisma.nguoiDung.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                ho_ten: true,
                vai_tro: true,
                trang_thai: true,
            },
        });
    }

    async remove(id: string) {
        // Soft delete is handled by PrismaService middleware
        return this.prisma.nguoiDung.delete({
            where: { id },
        });
    }
}
