/**
 * ============================================================
 * TAI SAN SERVICE - AssetTrack Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Asset Management Service:
 * - CRUD operations for assets
 * - assignAsset: Assign asset to user
 * - returnAsset: Return asset from user
 * - Usage history tracking via NhatKySuDung
 * - Multi-tenant support
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import {
    CreateTaiSanDto,
    UpdateTaiSanDto,
    QueryTaiSanDto,
    TrangThaiTaiSan,
} from '../dto/tai-san.dto';
import {
    AssignAssetDto,
    ReturnAssetDto,
    QueryNhatKySuDungDto,
} from '../dto/nhat-ky-su-dung.dto';

// Local helper function
function decimalToNumber(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

@Injectable()
export class TaiSanService {
    private readonly logger = new Logger(TaiSanService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================================
    // INCLUDE RELATIONS
    // ============================================================
    private readonly includeAssetRelations = {
        nhat_ky_su_dung: {
            where: {
                ngay_tra_thuc_te: null,
                ngay_xoa: null,
            },
            take: 1,
            orderBy: { ngay_muon: 'desc' as const },
            include: {
                nguoi_muon: {
                    select: {
                        id: true,
                        ho_ten: true,
                        email: true,
                    },
                },
            },
        },
    };

    private readonly includeLogRelations = {
        tai_san: {
            select: {
                id: true,
                ma_tai_san: true,
                ten_tai_san: true,
                ma_seri: true,
            },
        },
        nguoi_muon: {
            select: {
                id: true,
                ho_ten: true,
                email: true,
                phong_ban: true,
            },
        },
    };

    // ============================================================
    // HELPER: Transform asset for response
    // ============================================================
    private transformAsset(asset: any) {
        if (!asset) return asset;

        // Get current holder from active loan
        const activeLoan = asset.nhat_ky_su_dung?.[0];
        const nguoiDangGiu = activeLoan?.nguoi_muon || null;

        return {
            ...asset,
            gia_mua: decimalToNumber(asset.gia_mua),
            nguoi_dang_giu: nguoiDangGiu,
            nhat_ky_su_dung: undefined, // Remove from response
        };
    }

    private transformAssetList(assets: any[]) {
        return assets.map((a) => this.transformAsset(a));
    }

    private transformLog(log: any) {
        if (!log) return log;

        return {
            ...log,
            dang_muon: !log.ngay_tra_thuc_te,
        };
    }

    private transformLogList(logs: any[]) {
        return logs.map((l) => this.transformLog(l));
    }

    // ============================================================
    // GENERATE ASSET CODE
    // ============================================================
    private generateMaTaiSan(): string {
        return `TS-${Date.now()}`;
    }

    // ============================================================
    // CREATE - Create new asset
    // ============================================================
    async create(idDoanhNghiep: string, dto: CreateTaiSanDto, userId?: string) {
        const {
            ten_tai_san,
            ma_tai_san,
            ma_seri,
            loai_tai_san,
            ngay_mua,
            gia_mua,
            nha_cung_cap,
            thoi_han_bao_hanh,
            vi_tri_hien_tai,
            ghi_chu,
        } = dto;

        // Validate unique serial number per tenant
        if (ma_seri) {
            const existingSeri = await this.prisma.taiSan.findFirst({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    ma_seri,
                    ngay_xoa: null,
                },
            });
            if (existingSeri) {
                throw new ConflictException(`Ma seri "${ma_seri}" da ton tai trong he thong`);
            }
        }

        const assetId = uuidv4();
        const asset = await this.prisma.taiSan.create({
            data: {
                id: assetId,
                id_doanh_nghiep: idDoanhNghiep,
                ma_tai_san: ma_tai_san || this.generateMaTaiSan(),
                ten_tai_san,
                ma_seri,
                loai_tai_san,
                ngay_mua: ngay_mua ? new Date(ngay_mua) : null,
                gia_mua,
                nha_cung_cap,
                thoi_han_bao_hanh: thoi_han_bao_hanh ? new Date(thoi_han_bao_hanh) : null,
                vi_tri_hien_tai,
                trang_thai: TrangThaiTaiSan.AVAILABLE,
                ghi_chu,
                nguoi_tao_id: userId,
            } as any,
            include: this.includeAssetRelations,
        });

        this.logger.log(`Created asset: ${asset.ma_tai_san} - ${asset.ten_tai_san}`);
        return this.transformAsset(asset);
    }

    // ============================================================
    // FIND ALL - List assets with pagination and filters
    // ============================================================
    async findAll(idDoanhNghiep: string, query: QueryTaiSanDto) {
        const { page = 1, limit = 20, loai_tai_san, trang_thai, nguoi_dang_giu, search } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: any = {
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        if (loai_tai_san) {
            where.loai_tai_san = loai_tai_san;
        }

        if (trang_thai !== undefined) {
            where.trang_thai = trang_thai;
        }

        if (search) {
            where.OR = [
                { ten_tai_san: { contains: search } },
                { ma_tai_san: { contains: search } },
                { ma_seri: { contains: search } },
            ];
        }

        // Filter by current holder (need subquery)
        let assetIds: string[] | undefined;
        if (nguoi_dang_giu) {
            const activeLoans = await this.prisma.nhatKySuDung.findMany({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    id_nguoi_muon: nguoi_dang_giu,
                    ngay_tra_thuc_te: null,
                    ngay_xoa: null,
                },
                select: { id_tai_san: true },
            });
            assetIds = activeLoans.map(l => l.id_tai_san);
            where.id = { in: assetIds };
        }

        const [data, total] = await Promise.all([
            this.prisma.taiSan.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
                include: this.includeAssetRelations,
            }),
            this.prisma.taiSan.count({ where }),
        ]);

        return {
            data: this.transformAssetList(data),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // FIND ONE - Get asset by ID
    // ============================================================
    async findOne(idDoanhNghiep: string, id: string) {
        const asset = await this.prisma.taiSan.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: this.includeAssetRelations,
        });

        if (!asset) {
            throw new NotFoundException(`Khong tim thay tai san voi ID: ${id}`);
        }

        return this.transformAsset(asset);
    }

    // ============================================================
    // UPDATE - Update asset
    // ============================================================
    async update(idDoanhNghiep: string, id: string, dto: UpdateTaiSanDto, userId?: string) {
        // Check if asset exists
        await this.findOne(idDoanhNghiep, id);

        // Validate unique serial if updating
        if (dto.ma_seri) {
            const existingSeri = await this.prisma.taiSan.findFirst({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    ma_seri: dto.ma_seri,
                    id: { not: id },
                    ngay_xoa: null,
                },
            });
            if (existingSeri) {
                throw new ConflictException(`Ma seri "${dto.ma_seri}" da ton tai trong he thong`);
            }
        }

        // Build update data
        const updateData: any = {
            nguoi_cap_nhat_id: userId,
        };

        if (dto.ten_tai_san !== undefined) updateData.ten_tai_san = dto.ten_tai_san;
        if (dto.ma_tai_san !== undefined) updateData.ma_tai_san = dto.ma_tai_san;
        if (dto.ma_seri !== undefined) updateData.ma_seri = dto.ma_seri;
        if (dto.loai_tai_san !== undefined) updateData.loai_tai_san = dto.loai_tai_san;
        if (dto.ngay_mua !== undefined) updateData.ngay_mua = new Date(dto.ngay_mua);
        if (dto.gia_mua !== undefined) updateData.gia_mua = dto.gia_mua;
        if (dto.nha_cung_cap !== undefined) updateData.nha_cung_cap = dto.nha_cung_cap;
        if (dto.thoi_han_bao_hanh !== undefined) updateData.thoi_han_bao_hanh = new Date(dto.thoi_han_bao_hanh);
        if (dto.vi_tri_hien_tai !== undefined) updateData.vi_tri_hien_tai = dto.vi_tri_hien_tai;
        if (dto.trang_thai !== undefined) updateData.trang_thai = dto.trang_thai;
        if (dto.ghi_chu !== undefined) updateData.ghi_chu = dto.ghi_chu;

        const updated = await this.prisma.taiSan.update({
            where: { id },
            data: updateData,
            include: this.includeAssetRelations,
        });

        this.logger.log(`Updated asset: ${id}`);
        return this.transformAsset(updated);
    }

    // ============================================================
    // REMOVE - Soft delete asset
    // ============================================================
    async remove(idDoanhNghiep: string, id: string, userId?: string) {
        const asset = await this.findOne(idDoanhNghiep, id);

        // Check if asset is currently on loan
        if (asset.nguoi_dang_giu) {
            throw new BadRequestException(
                `Khong the xoa tai san "${asset.ten_tai_san}" vi dang duoc muon boi ${asset.nguoi_dang_giu.ho_ten}`
            );
        }

        const deleted = await this.prisma.taiSan.update({
            where: { id },
            data: {
                ngay_xoa: new Date(),
                nguoi_cap_nhat_id: userId,
            },
            include: this.includeAssetRelations,
        });

        this.logger.log(`Soft deleted asset: ${asset.ten_tai_san}`);
        return this.transformAsset(deleted);
    }

    // ============================================================
    // ASSIGN ASSET - Assign asset to user
    // ============================================================
    /**
     * Assign an asset to a user
     *
     * Flow:
     * 1. Check asset exists and is available
     * 2. Check user exists
     * 3. Create NhatKySuDung record
     * 4. Update asset status to IN_USE
     */
    async assignAsset(idDoanhNghiep: string, dto: AssignAssetDto, creatorId?: string) {
        const { tai_san_id, nguoi_dung_id, ngay_muon, ngay_tra_du_kien, ghi_chu } = dto;

        // 1. Check asset exists
        const asset = await this.findOne(idDoanhNghiep, tai_san_id);

        // 2. Check asset is available
        if (asset.nguoi_dang_giu) {
            throw new ConflictException(
                `Tai san "${asset.ten_tai_san}" dang duoc muon boi ${asset.nguoi_dang_giu.ho_ten}`
            );
        }

        if (asset.trang_thai !== TrangThaiTaiSan.AVAILABLE) {
            throw new BadRequestException(
                `Tai san "${asset.ten_tai_san}" khong san sang (trang thai: ${asset.trang_thai})`
            );
        }

        // 3. Check user exists
        const user = await this.prisma.nguoiDung.findFirst({
            where: {
                id: nguoi_dung_id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });
        if (!user) {
            throw new NotFoundException(`Khong tim thay nguoi dung voi ID: ${nguoi_dung_id}`);
        }

        // 4. Create usage log and update asset in transaction
        const logId = uuidv4();
        const borrowDate = ngay_muon ? new Date(ngay_muon) : new Date();

        const [log] = await this.prisma.$transaction([
            this.prisma.nhatKySuDung.create({
                data: {
                    id: logId,
                    id_doanh_nghiep: idDoanhNghiep,
                    id_tai_san: tai_san_id,
                    id_nguoi_muon: nguoi_dung_id,
                    ngay_muon: borrowDate,
                    ngay_tra_du_kien: ngay_tra_du_kien ? new Date(ngay_tra_du_kien) : null,
                    ghi_chu,
                    nguoi_tao_id: creatorId,
                } as any,
                include: this.includeLogRelations,
            }),
            this.prisma.taiSan.update({
                where: { id: tai_san_id },
                data: {
                    trang_thai: TrangThaiTaiSan.IN_USE,
                    nguoi_cap_nhat_id: creatorId,
                },
            }),
        ]);

        this.logger.log(
            `Assigned asset ${asset.ten_tai_san} to user ${user.ho_ten}`
        );

        return {
            message: `Da giao tai san "${asset.ten_tai_san}" cho ${user.ho_ten}`,
            data: this.transformLog(log),
        };
    }

    // ============================================================
    // RETURN ASSET - Return asset from user
    // ============================================================
    /**
     * Return an asset
     *
     * Flow:
     * 1. Find active loan for this asset
     * 2. Update NhatKySuDung with return date and condition
     * 3. Update asset status to AVAILABLE
     */
    async returnAsset(idDoanhNghiep: string, dto: ReturnAssetDto, userId?: string) {
        const { tai_san_id, tinh_trang_khi_tra, ghi_chu } = dto;

        // 1. Find active loan
        const activeLoan = await this.prisma.nhatKySuDung.findFirst({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                id_tai_san: tai_san_id,
                ngay_tra_thuc_te: null,
                ngay_xoa: null,
            },
            include: this.includeLogRelations,
        });

        if (!activeLoan) {
            throw new BadRequestException(
                `Tai san voi ID ${tai_san_id} khong dang duoc muon`
            );
        }

        // 2. Update log and asset in transaction
        const now = new Date();
        const [updatedLog] = await this.prisma.$transaction([
            this.prisma.nhatKySuDung.update({
                where: { id: activeLoan.id },
                data: {
                    ngay_tra_thuc_te: now,
                    tinh_trang_khi_tra,
                    ghi_chu: ghi_chu || activeLoan.ghi_chu,
                    nguoi_cap_nhat_id: userId,
                },
                include: this.includeLogRelations,
            }),
            this.prisma.taiSan.update({
                where: { id: tai_san_id },
                data: {
                    trang_thai: TrangThaiTaiSan.AVAILABLE,
                    nguoi_cap_nhat_id: userId,
                },
            }),
        ]);

        this.logger.log(
            `Asset ${activeLoan.tai_san?.ten_tai_san} returned by ${activeLoan.nguoi_muon?.ho_ten}`
        );

        return {
            message: `Da nhan lai tai san "${activeLoan.tai_san?.ten_tai_san}" tu ${activeLoan.nguoi_muon?.ho_ten}`,
            data: this.transformLog(updatedLog),
        };
    }

    // ============================================================
    // GET USAGE HISTORY
    // ============================================================
    async getUsageHistory(idDoanhNghiep: string, query: QueryNhatKySuDungDto) {
        const { page = 1, limit = 20, tai_san_id, nguoi_muon_id, chua_tra } = query;
        const skip = (page - 1) * limit;

        const where: any = {
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        if (tai_san_id) {
            where.id_tai_san = tai_san_id;
        }

        if (nguoi_muon_id) {
            where.id_nguoi_muon = nguoi_muon_id;
        }

        if (chua_tra) {
            where.ngay_tra_thuc_te = null;
        }

        const [data, total] = await Promise.all([
            this.prisma.nhatKySuDung.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_muon: 'desc' },
                include: this.includeLogRelations,
            }),
            this.prisma.nhatKySuDung.count({ where }),
        ]);

        return {
            data: this.transformLogList(data),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // COUNT - Count assets
    // ============================================================
    async count(idDoanhNghiep: string) {
        return this.prisma.taiSan.count({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });
    }
}
