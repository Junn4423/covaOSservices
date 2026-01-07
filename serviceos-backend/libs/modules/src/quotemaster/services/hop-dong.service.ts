/**
 * ============================================================
 * HỢP ĐỒNG SERVICE - QuoteMaster Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  PHASE 6: Contract Management
 *
 * Features:
 * 1. create(): Tạo hợp đồng thủ công
 * 2. createFromQuote():  Convert báo giá -> hợp đồng (Core feature)
 * 3. findAll(): Danh sách + filter (trạng thái, khách hàng, sắp hết hạn)
 * 4. findOne(): Chi tiết hợp đồng
 * 5. update(): Cập nhật thông tin (file_pdf_url, chu_ky_so_url...)
 * 6. updateStatus(): Cập nhật trạng thái
 * 7. remove(): Soft delete
 * 8. findExpiring(): Lấy danh sách sắp hết hạn
 *
 *  XỬ LÝ DECIMAL:
 * - Prisma trả về Prisma.Decimal, cần convert sang number cho response
 * - Sử dụng helper function decimalToNumberHopDong()
 */

import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import {
    CreateHopDongDto,
    CreateHopDongFromQuoteDto,
    UpdateHopDongDto,
    UpdateHopDongStatusDto,
    QueryHopDongDto,
    TrangThaiHopDong,
    TrangThaiHopDongLabel,
    decimalToNumberHopDong,
} from '../dto/hop-dong.dto';
import { TrangThaiBaoGia } from '../dto/bao-gia.dto';

@Injectable()
export class HopDongService {
    private readonly logger = new Logger(HopDongService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    /**
     * Include relations khi query
     */
    // Using 'as any' to avoid strict type issues with Prisma client
    // These issues will be resolved after running 'npx prisma generate'
    private readonly includeRelations: any = {
        khach_hang: {
            select: {
                id: true,
                ho_ten: true,
                so_dien_thoai: true,
                email: true,
            },
        },
        bao_gia: {
            select: {
                id: true,
                ma_bao_gia: true,
                tieu_de: true,
                tong_tien_sau_thue: true,
            },
        },
    };

    /**
     * Transform hợp đồng để convert Decimal fields sang number
     */
    private transformHopDong(hopDong: any): any {
        if (!hopDong) return null;

        return {
            ...hopDong,
            gia_tri_hop_dong: decimalToNumberHopDong(hopDong.gia_tri_hop_dong),
            trang_thai_label: TrangThaiHopDongLabel[hopDong.trang_thai as TrangThaiHopDong] || 'Không xác định',
            // Transform báo giá nếu có
            bao_gia: hopDong.bao_gia
                ? {
                    ...hopDong.bao_gia,
                    tong_tien_sau_thue: decimalToNumberHopDong(hopDong.bao_gia.tong_tien_sau_thue),
                }
                : null,
        };
    }

    /**
     * Transform danh sách hợp đồng
     */
    private transformHopDongList(hopDongList: any[]): any[] {
        return hopDongList.map((hd) => this.transformHopDong(hd));
    }

    /**
     * Sinh mã hợp đồng tự động: HD-{Timestamp}
     */
    private generateMaHopDong(): string {
        const timestamp = Date.now();
        return `HD-${timestamp}`;
    }

    // ============================================================
    // CREATE - Tạo hợp đồng thủ công
    // ============================================================

    /**
     *  CREATE - Tạo hợp đồng thủ công
     *
     * Flow:
     * 1. Validate khách hàng tồn tại
     * 2. Tự sinh mã hợp đồng HD-{Timestamp}
     * 3. Set ngày ký mặc định = now() nếu không truyền
     * 4. Tạo hợp đồng với trạng thái DRAFT
     */
    async create(dto: CreateHopDongDto) {
        this.logger.log(`Creating contract manually for customer: ${dto.id_khach_hang}`);

        // 1. Validate khách hàng
        const khachHang = await this.prisma.khachHang.findFirst({
            where: {
                id: dto.id_khach_hang,
                ngay_xoa: null,
            },
        });

        if (!khachHang) {
            throw new NotFoundException(`Không tìm thấy khách hàng với ID: ${dto.id_khach_hang}`);
        }

        // 2. Tạo hợp đồng
        const hopDong = await this.prisma.hopDong.create({
            data: {
                id: uuidv4(),
                id_doanh_nghiep: khachHang.id_doanh_nghiep,
                id_khach_hang: dto.id_khach_hang,
                ma_hop_dong: this.generateMaHopDong(),
                ten_hop_dong: dto.ten_hop_dong,
                gia_tri_hop_dong: new Prisma.Decimal(dto.gia_tri_hop_dong),
                ngay_ky: dto.ngay_ky ? new Date(dto.ngay_ky) : new Date(),
                ngay_het_han: dto.ngay_het_han ? new Date(dto.ngay_het_han) : null,
                ghi_chu: dto.ghi_chu,
                trang_thai: TrangThaiHopDong.DRAFT,
            },
            include: this.includeRelations,
        });

        this.logger.log(`Contract created: ${hopDong.ma_hop_dong}`);

        return this.transformHopDong(hopDong);
    }

    // ============================================================
    // CREATE FROM QUOTE -  Core Feature
    // ============================================================

    /**
     *  CREATE FROM QUOTE - Convert báo giá thành hợp đồng
     *
     *  Đây là tính năng CORE của Phase 6!
     *
     * Flow:
     * 1. Kiểm tra báo giá tồn tại và chưa bị xóa
     * 2. Kiểm tra trạng thái báo giá phải là ACCEPTED hoặc SENT
     * 3. Kiểm tra báo giá này đã có hợp đồng chưa (tránh tạo đúp)
     * 4. Copy dữ liệu từ báo giá sang hợp đồng:
     *    - id_khach_hang = bao_gia.id_khach_hang
     *    - gia_tri_hop_dong = bao_gia.tong_tien_sau_thue
     *    - id_bao_gia = bao_gia.id
     * 5. Set ngay_ky = now()
     * 6. Tạo hợp đồng với trạng thái DRAFT
     * 7. (Optional) Có thể cập nhật trạng thái báo giá thành CONVERTED nếu cần
     */
    async createFromQuote(quoteId: string, dto?: CreateHopDongFromQuoteDto) {
        this.logger.log(`Converting quote to contract: ${quoteId}`);

        // 1. Lấy thông tin báo giá
        const baoGia = await this.prisma.baoGia.findFirst({
            where: {
                id: quoteId,
                ngay_xoa: null,
            },
            include: {
                khach_hang: {
                    select: {
                        id: true,
                        ho_ten: true,
                    },
                },
            } as any,
        });

        if (!baoGia) {
            throw new NotFoundException(`Không tìm thấy báo giá với ID: ${quoteId}`);
        }

        // 2. Kiểm tra trạng thái báo giá
        const validStatuses: string[] = [TrangThaiBaoGia.ACCEPTED, TrangThaiBaoGia.SENT];
        if (!validStatuses.includes(baoGia.trang_thai as unknown as string)) {
            throw new BadRequestException(
                `Chỉ có thể chuyển đổi báo giá có trạng thái ACCEPTED hoặc SENT. Trạng thái hiện tại: ${baoGia.trang_thai}`
            );
        }

        // 3. Kiểm tra báo giá đã có hợp đồng chưa (tránh tạo đúp)
        const existingContract = await this.prisma.hopDong.findFirst({
            where: {
                id_bao_gia: quoteId,
                ngay_xoa: null,
            },
        });

        if (existingContract) {
            throw new ConflictException(
                `Báo giá ${baoGia.ma_bao_gia} đã được chuyển đổi thành hợp đồng ${existingContract.ma_hop_dong}`
            );
        }

        // 4. Copy dữ liệu từ báo giá sang hợp đồng
        const tenHopDong = dto?.ten_hop_dong ||
            (baoGia.tieu_de ? `Hợp đồng - ${baoGia.tieu_de}` : `Hợp đồng từ ${baoGia.ma_bao_gia}`);

        const hopDong = await this.prisma.hopDong.create({
            data: {
                id: uuidv4(),
                id_doanh_nghiep: baoGia.id_doanh_nghiep,
                id_khach_hang: baoGia.id_khach_hang,
                id_bao_gia: baoGia.id,
                ma_hop_dong: this.generateMaHopDong(),
                ten_hop_dong: tenHopDong,
                gia_tri_hop_dong: (baoGia as any).tong_tien_sau_thue, // Copy từ báo giá
                ngay_ky: new Date(), // Ngày ký = hôm nay
                ngay_het_han: dto?.ngay_het_han ? new Date(dto.ngay_het_han) : null,
                ghi_chu: dto?.ghi_chu || `Chuyển đổi từ báo giá ${baoGia.ma_bao_gia}`,
                trang_thai: TrangThaiHopDong.DRAFT,
            },
            include: this.includeRelations,
        });

        this.logger.log(`Contract created from quote: ${hopDong.ma_hop_dong} <- ${baoGia.ma_bao_gia}`);

        // 5. (Optional) Có thể cập nhật trạng thái báo giá ở đây nếu cần
        // await this.prisma.baoGia.update({
        //     where: { id: baoGia.id },
        //     data: { trang_thai: 'CONVERTED' },
        // });

        return {
            hop_dong: this.transformHopDong(hopDong),
            bao_gia_goc: {
                id: baoGia.id,
                ma_bao_gia: baoGia.ma_bao_gia,
                tieu_de: baoGia.tieu_de,
                trang_thai: baoGia.trang_thai,
                khach_hang: (baoGia as any).khach_hang,
            },
            message: `Đã chuyển đổi thành công báo giá ${baoGia.ma_bao_gia} thành hợp đồng ${hopDong.ma_hop_dong}`,
        };
    }

    // ============================================================
    // FIND ALL - Danh sách + Filter + Pagination
    // ============================================================

    /**
     *  FIND ALL - Danh sách hợp đồng với filter + phân trang
     *
     * Filters:
     * - trang_thai: Lọc theo trạng thái
     * - id_khach_hang: Lọc theo khách hàng
     * - sap_het_han: Lọc các hợp đồng sắp hết hạn trong 30 ngày
     * - search: Tìm theo mã hoặc tên hợp đồng
     */
    async findAll(query: QueryHopDongDto) {
        const { page = 1, limit = 20, trang_thai, id_khach_hang, sap_het_han, search } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: Prisma.HopDongWhereInput = {
            ngay_xoa: null, // Exclude soft-deleted
        };

        // Filter by trạng thái
        if (trang_thai !== undefined) {
            where.trang_thai = trang_thai;
        }

        // Filter by khách hàng
        if (id_khach_hang) {
            where.id_khach_hang = id_khach_hang;
        }

        // Filter sắp hết hạn (trong 30 ngày tới)
        if (sap_het_han) {
            const today = new Date();
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(today.getDate() + 30);

            where.ngay_het_han = {
                gte: today,
                lte: thirtyDaysLater,
            };
            // Chỉ lấy các hợp đồng đang ACTIVE
            where.trang_thai = TrangThaiHopDong.ACTIVE;
        }

        // Search by mã hoặc tên hợp đồng
        if (search) {
            where.OR = [
                { ma_hop_dong: { contains: search } },
                { ten_hop_dong: { contains: search } },
            ];
        }

        // Execute query with count
        const [hopDongList, total] = await Promise.all([
            this.prisma.hopDong.findMany({
                where,
                include: this.includeRelations,
                orderBy: { ngay_tao: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.hopDong.count({ where }),
        ]);

        return {
            data: this.transformHopDongList(hopDongList),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // FIND ONE - Chi tiết hợp đồng
    // ============================================================

    /**
     *  FIND ONE - Lấy chi tiết một hợp đồng
     */
    async findOne(id: string) {
        const hopDong = await this.prisma.hopDong.findFirst({
            where: {
                id,
                ngay_xoa: null,
            },
            include: this.includeRelations,
        });

        if (!hopDong) {
            throw new NotFoundException(`Không tìm thấy hợp đồng với ID: ${id}`);
        }

        return this.transformHopDong(hopDong);
    }

    // ============================================================
    // FIND EXPIRING - Danh sách sắp hết hạn
    // ============================================================

    /**
     *  FIND EXPIRING - Lấy danh sách hợp đồng sắp hết hạn
     *
     * Dùng cho Dashboard để hiển thị cảnh báo
     * Mặc định: 30 ngày tới
     */
    async findExpiring(warningDays: number = 30) {
        const today = new Date();
        const warningDate = new Date();
        warningDate.setDate(today.getDate() + warningDays);

        const hopDongList = await this.prisma.hopDong.findMany({
            where: {
                ngay_xoa: null,
                trang_thai: TrangThaiHopDong.ACTIVE, // Chỉ lấy hợp đồng đang hiệu lực
                ngay_het_han: {
                    gte: today,
                    lte: warningDate,
                },
            },
            include: this.includeRelations,
            orderBy: { ngay_het_han: 'asc' }, // Sắp xếp theo ngày hết hạn gần nhất
        });

        return {
            data: this.transformHopDongList(hopDongList),
            total: hopDongList.length,
            check_date: today,
            warning_days: warningDays,
        };
    }

    // ============================================================
    // UPDATE - Cập nhật hợp đồng
    // ============================================================

    /**
     *  UPDATE - Cập nhật thông tin hợp đồng
     *
     * Cho phép cập nhật:
     * - ten_hop_dong
     * - ngay_het_han
     * - file_pdf_url
     * - chu_ky_so_url
     * - ghi_chu
     */
    async update(id: string, dto: UpdateHopDongDto) {
        // Check exists
        const existing = await this.prisma.hopDong.findFirst({
            where: {
                id,
                ngay_xoa: null,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Không tìm thấy hợp đồng với ID: ${id}`);
        }

        // Update
        const hopDong = await this.prisma.hopDong.update({
            where: { id },
            data: {
                ten_hop_dong: dto.ten_hop_dong,
                ngay_het_han: dto.ngay_het_han ? new Date(dto.ngay_het_han) : undefined,
                file_pdf_url: dto.file_pdf_url,
                chu_ky_so_url: dto.chu_ky_so_url,
                ghi_chu: dto.ghi_chu,
            },
            include: this.includeRelations,
        });

        this.logger.log(`Contract updated: ${hopDong.ma_hop_dong}`);

        return this.transformHopDong(hopDong);
    }

    // ============================================================
    // UPDATE STATUS - Cập nhật trạng thái
    // ============================================================

    /**
     *  UPDATE STATUS - Cập nhật trạng thái hợp đồng
     *
     * Các transition hợp lệ:
     * - DRAFT -> ACTIVE (Kích hoạt hợp đồng)
     * - ACTIVE -> LIQUIDATED (Thanh lý)
     * - ACTIVE -> EXPIRED (Hết hạn - thường do job tự động)
     * - Any -> CANCELLED (Hủy)
     */
    async updateStatus(id: string, dto: UpdateHopDongStatusDto) {
        const existing = await this.prisma.hopDong.findFirst({
            where: {
                id,
                ngay_xoa: null,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Không tìm thấy hợp đồng với ID: ${id}`);
        }

        // Validate status transition
        const currentStatus = existing.trang_thai as TrangThaiHopDong;
        const newStatus = dto.trang_thai;

        // Không cho phép chuyển ngược về DRAFT
        if (newStatus === TrangThaiHopDong.DRAFT && currentStatus !== TrangThaiHopDong.DRAFT) {
            throw new BadRequestException('Không thể chuyển hợp đồng về trạng thái DRAFT');
        }

        // Không cho phép thay đổi trạng thái của hợp đồng đã thanh lý hoặc đã hủy
        if (currentStatus === TrangThaiHopDong.LIQUIDATED || currentStatus === TrangThaiHopDong.CANCELLED) {
            throw new BadRequestException(
                `Không thể thay đổi trạng thái của hợp đồng đã ${TrangThaiHopDongLabel[currentStatus]}`
            );
        }

        const hopDong = await this.prisma.hopDong.update({
            where: { id },
            data: {
                trang_thai: newStatus,
            },
            include: this.includeRelations,
        });

        this.logger.log(
            `Contract status updated: ${hopDong.ma_hop_dong} (${TrangThaiHopDongLabel[currentStatus]} -> ${TrangThaiHopDongLabel[newStatus]})`
        );

        return this.transformHopDong(hopDong);
    }

    // ============================================================
    // REMOVE - Soft Delete
    // ============================================================

    /**
     *  REMOVE - Xóa mềm hợp đồng
     *
     * Chỉ cho phép xóa hợp đồng ở trạng thái DRAFT
     */
    async remove(id: string) {
        const existing = await this.prisma.hopDong.findFirst({
            where: {
                id,
                ngay_xoa: null,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Không tìm thấy hợp đồng với ID: ${id}`);
        }

        // Chỉ cho phép xóa DRAFT
        if (existing.trang_thai !== TrangThaiHopDong.DRAFT) {
            throw new BadRequestException(
                `Chỉ có thể xóa hợp đồng ở trạng thái Nháp. Trạng thái hiện tại: ${TrangThaiHopDongLabel[existing.trang_thai as TrangThaiHopDong]}`
            );
        }

        await this.prisma.hopDong.update({
            where: { id },
            data: {
                ngay_xoa: new Date(),
            },
        });

        this.logger.log(`Contract soft-deleted: ${existing.ma_hop_dong}`);

        return {
            message: `Đã xóa hợp đồng ${existing.ma_hop_dong}`,
            id,
        };
    }

    // ============================================================
    // STATS - Thống kê
    // ============================================================

    /**
     *  STATS - Thống kê hợp đồng theo trạng thái
     */
    async getStats() {
        const [stats, totalValue, expiringCount] = await Promise.all([
            // Đếm theo trạng thái
            this.prisma.hopDong.groupBy({
                by: ['trang_thai'],
                where: { ngay_xoa: null },
                _count: { id: true },
            }),
            // Tổng giá trị hợp đồng ACTIVE
            this.prisma.hopDong.aggregate({
                where: {
                    ngay_xoa: null,
                    trang_thai: TrangThaiHopDong.ACTIVE,
                },
                _sum: { gia_tri_hop_dong: true },
            }),
            // Đếm số hợp đồng sắp hết hạn (30 ngày)
            this.prisma.hopDong.count({
                where: {
                    ngay_xoa: null,
                    trang_thai: TrangThaiHopDong.ACTIVE,
                    ngay_het_han: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);

        // Transform stats
        const statsByStatus = stats.reduce(
            (acc, item) => {
                const status = item.trang_thai as TrangThaiHopDong;
                acc[TrangThaiHopDongLabel[status] || `Status_${status}`] = item._count.id;
                return acc;
            },
            {} as Record<string, number>
        );

        return {
            by_status: statsByStatus,
            total_active_value: decimalToNumberHopDong(totalValue._sum.gia_tri_hop_dong),
            expiring_soon: expiringCount,
        };
    }
}
