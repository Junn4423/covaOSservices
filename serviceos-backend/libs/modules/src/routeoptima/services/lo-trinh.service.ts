/**
 * ============================================================
 * LO TRINH SERVICE - RouteOptima Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Route Management Service:
 * - createRoute: Create route with stops in transaction
 * - getMyRoute: Get route for current user by date
 * - updateStopStatus: Mark stop as visited/skipped
 * - optimizeRoute: Re-order stops (placeholder for TSP)
 * - Multi-tenant support
 */

import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import {
    CreateLoTrinhDto,
    QueryLoTrinhDto,
    QueryMyRouteDto,
    TrangThaiLoTrinh,
    TrangThaiDiemDung,
} from '../dto/lo-trinh.dto';
import { UpdateStopStatusDto } from '../dto/diem-dung.dto';

// Local helper function
function decimalToNumber(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

@Injectable()
export class LoTrinhService {
    private readonly logger = new Logger(LoTrinhService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================================
    // INCLUDE RELATIONS
    // ============================================================
    private readonly includeRouteRelations = {
        nguoi_dung: {
            select: {
                id: true,
                ho_ten: true,
                email: true,
                so_dien_thoai: true,
            },
        },
        diem_dung: {
            where: { ngay_xoa: null },
            orderBy: { thu_tu: 'asc' as const },
            include: {
                cong_viec: {
                    select: {
                        id: true,
                        ma_cong_viec: true,
                        tieu_de: true,
                    },
                },
            },
        },
    };

    // ============================================================
    // HELPER: Transform route for response
    // ============================================================
    private transformRoute(route: any) {
        if (!route) return route;

        return {
            ...route,
            tong_khoang_cach: decimalToNumber(route.tong_khoang_cach),
            diem_dung: route.diem_dung?.map((stop: any) => ({
                ...stop,
                toa_do_lat: decimalToNumber(stop.toa_do_lat),
                toa_do_lng: decimalToNumber(stop.toa_do_lng),
            })),
        };
    }

    private transformRouteList(routes: any[]) {
        return routes.map((r) => this.transformRoute(r));
    }

    // ============================================================
    // HELPER: Get today's date at midnight
    // ============================================================
    private getTodayDate(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // ============================================================
    // CREATE ROUTE - Create route with stops
    // ============================================================
    /**
     * Create a new route with stops
     *
     * @param idDoanhNghiep - Tenant ID
     * @param dto - CreateLoTrinhDto
     * @param creatorId - Creator user ID
     *
     * Flow:
     * 1. Validate user exists
     * 2. Validate jobs exist (if provided)
     * 3. Create LoTrinh and DiemDung in transaction
     */
    async createRoute(idDoanhNghiep: string, dto: CreateLoTrinhDto, creatorId?: string) {
        const { ngay_lo_trinh, nguoi_dung_id, stops, ghi_chu } = dto;

        // 1. Validate user exists
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

        // 2. Validate jobs exist
        const jobIds = stops.filter(s => s.cong_viec_id).map(s => s.cong_viec_id!);
        if (jobIds.length > 0) {
            const existingJobs = await this.prisma.congViec.findMany({
                where: {
                    id: { in: jobIds },
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                },
                select: { id: true },
            });
            const existingJobIds = new Set(existingJobs.map(j => j.id));
            const missingJobs = jobIds.filter(id => !existingJobIds.has(id));
            if (missingJobs.length > 0) {
                throw new NotFoundException(`Khong tim thay cong viec voi ID: ${missingJobs.join(', ')}`);
            }
        }

        // 3. Create route and stops in transaction
        const routeId = uuidv4();
        const routeDate = new Date(ngay_lo_trinh);

        const route = await this.prisma.$transaction(async (tx) => {
            // Create route
            const newRoute = await tx.loTrinh.create({
                data: {
                    id: routeId,
                    id_doanh_nghiep: idDoanhNghiep,
                    id_nguoi_dung: nguoi_dung_id,
                    ngay_lo_trinh: routeDate,
                    trang_thai: TrangThaiLoTrinh.PENDING,
                    ghi_chu,
                    nguoi_tao_id: creatorId,
                } as any,
            });

            // Create stops
            const stopsData = stops.map(stop => ({
                id: uuidv4(),
                id_doanh_nghiep: idDoanhNghiep,
                id_lo_trinh: routeId,
                id_cong_viec: stop.cong_viec_id || null,
                thu_tu: stop.thu_tu,
                dia_chi: stop.dia_chi,
                toa_do_lat: stop.toa_do_lat,
                toa_do_lng: stop.toa_do_lng,
                thoi_gian_den_du_kien: stop.thoi_gian_den_du_kien
                    ? new Date(stop.thoi_gian_den_du_kien)
                    : null,
                trang_thai: TrangThaiDiemDung.PENDING,
                ghi_chu: stop.ghi_chu,
                nguoi_tao_id: creatorId,
            }));

            await tx.diemDung.createMany({
                data: stopsData as any,
            });

            return newRoute;
        });

        // Fetch complete route with relations
        const completeRoute = await this.prisma.loTrinh.findUnique({
            where: { id: routeId },
            include: this.includeRouteRelations,
        });

        this.logger.log(
            `Created route for ${user.ho_ten} on ${ngay_lo_trinh} with ${stops.length} stops`
        );

        return this.transformRoute(completeRoute);
    }

    // ============================================================
    // FIND ALL - List routes with pagination
    // ============================================================
    async findAll(idDoanhNghiep: string, query: QueryLoTrinhDto) {
        const { page = 1, limit = 20, ngay, nguoi_dung_id, trang_thai } = query;
        const skip = (page - 1) * limit;

        const where: any = {
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        if (ngay) {
            const routeDate = new Date(ngay);
            where.ngay_lo_trinh = routeDate;
        }

        if (nguoi_dung_id) {
            where.id_nguoi_dung = nguoi_dung_id;
        }

        if (trang_thai !== undefined) {
            where.trang_thai = trang_thai;
        }

        const [data, total] = await Promise.all([
            this.prisma.loTrinh.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_lo_trinh: 'desc' },
                include: this.includeRouteRelations,
            }),
            this.prisma.loTrinh.count({ where }),
        ]);

        return {
            data: this.transformRouteList(data),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // FIND ONE - Get route by ID
    // ============================================================
    async findOne(idDoanhNghiep: string, id: string) {
        const route = await this.prisma.loTrinh.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: this.includeRouteRelations,
        });

        if (!route) {
            throw new NotFoundException(`Khong tim thay lo trinh voi ID: ${id}`);
        }

        return this.transformRoute(route);
    }

    // ============================================================
    // GET MY ROUTE - Get route for current user
    // ============================================================
    /**
     * Get route for the current logged-in user by date
     *
     * @param idDoanhNghiep - Tenant ID
     * @param query - QueryMyRouteDto
     * @param userId - Current user ID
     */
    async getMyRoute(idDoanhNghiep: string, query: QueryMyRouteDto, userId: string) {
        const routeDate = query.ngay ? new Date(query.ngay) : this.getTodayDate();

        const route = await this.prisma.loTrinh.findFirst({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                id_nguoi_dung: userId,
                ngay_lo_trinh: routeDate,
                ngay_xoa: null,
            },
            include: this.includeRouteRelations,
        });

        if (!route) {
            return {
                message: 'Khong co lo trinh cho ngay nay',
                data: null,
            };
        }

        return {
            message: 'Tim thay lo trinh',
            data: this.transformRoute(route),
        };
    }

    // ============================================================
    // UPDATE STOP STATUS - Mark stop as visited/skipped
    // ============================================================
    /**
     * Update stop status
     *
     * @param idDoanhNghiep - Tenant ID
     * @param diemDungId - Stop ID
     * @param dto - UpdateStopStatusDto
     * @param userId - User ID
     *
     * Flow:
     * 1. Find stop and validate
     * 2. Update stop status and times
     * 3. Check if all stops are completed
     * 4. If yes, mark route as completed
     */
    async updateStopStatus(
        idDoanhNghiep: string,
        diemDungId: string,
        dto: UpdateStopStatusDto,
        userId?: string,
    ) {
        // 1. Find stop
        const stop = await this.prisma.diemDung.findFirst({
            where: {
                id: diemDungId,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: {
                lo_trinh: true,
            },
        });

        if (!stop) {
            throw new NotFoundException(`Khong tim thay diem dung voi ID: ${diemDungId}`);
        }

        // 2. Update stop
        const now = new Date();
        const updateData: any = {
            trang_thai: dto.trang_thai,
            nguoi_cap_nhat_id: userId,
        };

        if (dto.thoi_gian_den_thuc_te) {
            updateData.thoi_gian_den_thuc_te = new Date(dto.thoi_gian_den_thuc_te);
        } else if (dto.trang_thai === TrangThaiDiemDung.VISITED) {
            updateData.thoi_gian_den_thuc_te = now;
        }

        if (dto.thoi_gian_roi_di) {
            updateData.thoi_gian_roi_di = new Date(dto.thoi_gian_roi_di);
        }

        // Note: toa_do_thuc_te fields are not in schema, but we can add them to ghi_chu or extend later
        if (dto.toa_do_thuc_te_lat && dto.toa_do_thuc_te_lng) {
            const coordNote = `Toa do thuc te: ${dto.toa_do_thuc_te_lat}, ${dto.toa_do_thuc_te_lng}`;
            updateData.ghi_chu = stop.ghi_chu ? `${stop.ghi_chu}\n${coordNote}` : coordNote;
        }

        const updatedStop = await this.prisma.diemDung.update({
            where: { id: diemDungId },
            data: updateData,
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

        // 3. Check if all stops are completed
        const allStops = await this.prisma.diemDung.findMany({
            where: {
                id_lo_trinh: stop.id_lo_trinh,
                ngay_xoa: null,
            },
            select: { trang_thai: true },
        });

        const allCompleted = allStops.every(
            s => s.trang_thai === TrangThaiDiemDung.VISITED || s.trang_thai === TrangThaiDiemDung.SKIPPED
        );

        // 4. Update route if all completed
        let routeCompleted = false;
        if (allCompleted) {
            await this.prisma.loTrinh.update({
                where: { id: stop.id_lo_trinh },
                data: {
                    trang_thai: TrangThaiLoTrinh.COMPLETED,
                    thoi_gian_ket_thuc: now,
                    nguoi_cap_nhat_id: userId,
                },
            });
            routeCompleted = true;
            this.logger.log(`Lộ trình ${stop.id_lo_trinh} đã hoàn thành`);
        } else if (stop.lo_trinh.trang_thai === TrangThaiLoTrinh.PENDING) {
            // Start route if first stop is being updated
            await this.prisma.loTrinh.update({
                where: { id: stop.id_lo_trinh },
                data: {
                    trang_thai: TrangThaiLoTrinh.IN_PROGRESS,
                    thoi_gian_bat_dau: now,
                    nguoi_cap_nhat_id: userId,
                },
            });
        }

        const statusText = dto.trang_thai === TrangThaiDiemDung.VISITED ? 'Đã ghé thăm' : 'Đã bỏ qua';
        this.logger.log(`Điểm dừng ${diemDungId} được đánh dấu là ${statusText}`);

        return {
            message: `Diem dung da duoc cap nhat thanh ${statusText}`,
            data: {
                ...updatedStop,
                toa_do_lat: decimalToNumber(updatedStop.toa_do_lat),
                toa_do_lng: decimalToNumber(updatedStop.toa_do_lng),
            },
            route_completed: routeCompleted,
        };
    }

    // ============================================================
    // OPTIMIZE ROUTE - Re-order stops
    // ============================================================
    /**
     * Optimize route by re-ordering stops
     * Currently: Simple sort by thu_tu (placeholder for TSP algorithm)
     *
     * @param idDoanhNghiep - Tenant ID
     * @param loTrinhId - Route ID
     */
    async optimizeRoute(idDoanhNghiep: string, loTrinhId: string) {
        // Find route
        const route = await this.findOne(idDoanhNghiep, loTrinhId);

        if (route.trang_thai !== TrangThaiLoTrinh.PENDING) {
            throw new BadRequestException(
                'Chỉ có thể tối ưu hóa lộ trình chưa bắt đầu'
            );
        }

        // Get all stops
        const stops = await this.prisma.diemDung.findMany({
            where: {
                id_lo_trinh: loTrinhId,
                ngay_xoa: null,
            },
            orderBy: { thu_tu: 'asc' },
        });

        // TODO: Implement TSP algorithm here
        // For now, just sort by current thu_tu (no change)
        // Future: Use coordinates to calculate optimal route

        // Re-assign thu_tu in order
        const updates = stops.map((stop, index) =>
            this.prisma.diemDung.update({
                where: { id: stop.id },
                data: { thu_tu: index + 1 },
            })
        );

        await this.prisma.$transaction(updates);

        // Fetch updated route
        const optimizedRoute = await this.findOne(idDoanhNghiep, loTrinhId);

        this.logger.log(`Lộ trình ${loTrinhId} đã được tối ưu hóa (placeholder - TSP chưa được triển khai)`);

        return {
            message: 'Lộ trình đã được tối ưu hóa (placeholder)',
            data: optimizedRoute,
            note: 'TSP algorithm chưa được implement. Hiện tại chỉ sort theo thứ tự.',
        };
    }

    // ============================================================
    // START ROUTE - Mark route as started
    // ============================================================
    async startRoute(idDoanhNghiep: string, loTrinhId: string, userId?: string) {
        const route = await this.findOne(idDoanhNghiep, loTrinhId);

        if (route.trang_thai !== TrangThaiLoTrinh.PENDING) {
            throw new BadRequestException('Lo trinh da bat dau hoac hoan thanh');
        }

        const updated = await this.prisma.loTrinh.update({
            where: { id: loTrinhId },
            data: {
                trang_thai: TrangThaiLoTrinh.IN_PROGRESS,
                thoi_gian_bat_dau: new Date(),
                nguoi_cap_nhat_id: userId,
            },
            include: this.includeRouteRelations,
        });

        this.logger.log(`Lộ trình ${loTrinhId} đã bắt đầu`);
        return this.transformRoute(updated);
    }

    // ============================================================
    // CANCEL ROUTE
    // ============================================================
    async cancelRoute(idDoanhNghiep: string, loTrinhId: string, userId?: string) {
        const route = await this.findOne(idDoanhNghiep, loTrinhId);

        if (route.trang_thai === TrangThaiLoTrinh.COMPLETED) {
            throw new BadRequestException('Khong the huy lo trinh da hoan thanh');
        }

        const updated = await this.prisma.loTrinh.update({
            where: { id: loTrinhId },
            data: {
                trang_thai: TrangThaiLoTrinh.CANCELLED,
                nguoi_cap_nhat_id: userId,
            },
            include: this.includeRouteRelations,
        });

        this.logger.log(`Lộ trình ${loTrinhId} đã bị hủy`);
        return this.transformRoute(updated);
    }

    // ============================================================
    // REMOVE - Soft delete route
    // ============================================================
    async remove(idDoanhNghiep: string, loTrinhId: string, userId?: string) {
        const route = await this.findOne(idDoanhNghiep, loTrinhId);

        // Soft delete route and all stops
        await this.prisma.$transaction([
            this.prisma.diemDung.updateMany({
                where: { id_lo_trinh: loTrinhId },
                data: { ngay_xoa: new Date() },
            }),
            this.prisma.loTrinh.update({
                where: { id: loTrinhId },
                data: {
                    ngay_xoa: new Date(),
                    nguoi_cap_nhat_id: userId,
                },
            }),
        ]);

        this.logger.log(`Lộ trình ${loTrinhId} đã bị xóa mềm`);
        return route;
    }
}
