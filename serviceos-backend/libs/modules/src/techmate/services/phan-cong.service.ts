import { Injectable } from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PhanCongService {
    constructor(private prisma: PrismaService) { }

    async assign(id_cong_viec: string, id_nguoi_dung: string, la_truong_nhom = false) {
        return this.prisma.phanCong.create({
            data: { id: uuidv4(), id_cong_viec, id_nguoi_dung, la_truong_nhom: la_truong_nhom ? 1 : 0 } as any,
        });
    }

    async unassign(id_cong_viec: string, id_nguoi_dung: string) {
        return this.prisma.phanCong.deleteMany({
            where: { id_cong_viec, id_nguoi_dung },
        });
    }

    async getByJob(id_cong_viec: string) {
        return this.prisma.phanCong.findMany({
            where: { id_cong_viec },
            include: { nguoi_dung: { select: { id: true, ho_ten: true, so_dien_thoai: true } } },
        });
    }

    async getByUser(id_nguoi_dung: string) {
        return this.prisma.phanCong.findMany({
            where: { id_nguoi_dung },
            include: { cong_viec: true },
        });
    }
}
