/**
 * ============================================================
 * CA LAM VIEC SERVICE - ShiftSquad Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Shift Management Service:
 * - CRUD operations for work shifts
 * - getCurrentShift: Detect which shift applies to current time/day
 * - Time format handling for MySQL TIME field
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
    CreateCaLamViecDto,
    UpdateCaLamViecDto,
    QueryCaLamViecDto,
    parseTimeString,
    formatTimeToString,
    parseDaysOfWeek,
} from '../dto/ca-lam-viec.dto';

@Injectable()
export class CaLamViecService {
    private readonly logger = new Logger(CaLamViecService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ============================================================
    // HELPER: Transform shift for response
    // ============================================================
    private transformShift(shift: any) {
        if (!shift) return shift;

        return {
            ...shift,
            // Format time fields to HH:mm string for frontend
            gio_bat_dau_str: formatTimeToString(shift.gio_bat_dau),
            gio_ket_thuc_str: formatTimeToString(shift.gio_ket_thuc),
        };
    }

    private transformShiftList(shifts: any[]) {
        return shifts.map((s) => this.transformShift(s));
    }

    // ============================================================
    // CREATE - Create new shift
    // ============================================================
    /**
     * Create a new work shift
     *
     * @param idDoanhNghiep - Tenant ID (multi-tenant)
     * @param dto - CreateCaLamViecDto
     * @param userId - Creator user ID (optional)
     *
     * Flow:
     * 1. Parse time strings to Date objects
     * 2. Validate start time < end time
     * 3. Create shift record
     */
    async create(idDoanhNghiep: string, dto: CreateCaLamViecDto, userId?: string) {
        const { ten_ca, gio_bat_dau, gio_ket_thuc, ap_dung_thu = '2,3,4,5,6' } = dto;

        // 1. Parse times
        const startTime = parseTimeString(gio_bat_dau);
        const endTime = parseTimeString(gio_ket_thuc);

        // 2. Validate: Start time must be before end time
        if (startTime >= endTime) {
            throw new BadRequestException(
                'Gio bat dau phai nho hon gio ket thuc'
            );
        }

        // 3. Create shift
        const shiftId = uuidv4();
        const shift = await this.prisma.caLamViec.create({
            data: {
                id: shiftId,
                id_doanh_nghiep: idDoanhNghiep,
                ten_ca,
                gio_bat_dau: startTime,
                gio_ket_thuc: endTime,
                ap_dung_thu,
                trang_thai: 1,
                nguoi_tao_id: userId,
            } as any,
        });

        this.logger.log(
            `Tao ca lam viec: ${ten_ca} (${gio_bat_dau} - ${gio_ket_thuc}) [Tenant: ${idDoanhNghiep}]`
        );

        return this.transformShift(shift);
    }

    // ============================================================
    // FIND ALL - List all shifts with pagination
    // ============================================================
    async findAll(idDoanhNghiep: string, query: QueryCaLamViecDto) {
        const { page = 1, limit = 20, trang_thai, search } = query;
        const skip = (page - 1) * limit;

        // Build where conditions
        const where: any = {
            id_doanh_nghiep: idDoanhNghiep,
            ngay_xoa: null,
        };

        if (trang_thai !== undefined) {
            where.trang_thai = trang_thai;
        }

        if (search) {
            where.ten_ca = { contains: search };
        }

        const [data, total] = await Promise.all([
            this.prisma.caLamViec.findMany({
                where,
                skip,
                take: limit,
                orderBy: { gio_bat_dau: 'asc' },
            }),
            this.prisma.caLamViec.count({ where }),
        ]);

        return {
            data: this.transformShiftList(data),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // FIND ONE - Get shift by ID
    // ============================================================
    async findOne(idDoanhNghiep: string, id: string) {
        const shift = await this.prisma.caLamViec.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (!shift) {
            throw new NotFoundException(`Khong tim thay ca lam viec voi ID: ${id}`);
        }

        return this.transformShift(shift);
    }

    // ============================================================
    // GET CURRENT SHIFT - Detect shift for current time & day
    // ============================================================
    /**
     * Determine which shift applies to the current time and day of week
     *
     * @param idDoanhNghiep - Tenant ID
     *
     * Logic:
     * 1. Get current time (local timezone)
     * 2. Get current day of week (2=Mon, 3=Tue, ..., 8=Sun)
     * 3. Find shifts that:
     *    - Are active (trang_thai = 1)
     *    - Apply to current day
     *    - Current time is within shift hours
     * 4. Return the first matching shift or null
     *
     * Note: Uses local timezone for comparison
     */
    async getCurrentShift(idDoanhNghiep: string): Promise<any | null> {
        const now = new Date();

        // Get current day of week (JavaScript: 0=Sun, 1=Mon, ..., 6=Sat)
        // Convert to Vietnamese format: 2=Mon, 3=Tue, ..., 8=Sun
        const jsDay = now.getDay();
        const vnDay = jsDay === 0 ? 8 : jsDay + 1;

        // Get current time as hours and minutes
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeMinutes = currentHours * 60 + currentMinutes;

        // Fetch all active shifts for this tenant
        const shifts = await this.prisma.caLamViec.findMany({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
                trang_thai: 1,
            },
        });

        // Find matching shift
        for (const shift of shifts) {
            // Check if current day is in shift's apply days
            const applyDays = parseDaysOfWeek(shift.ap_dung_thu);
            if (!applyDays.includes(vnDay)) {
                continue;
            }

            // Parse shift times
            const startTime = new Date(shift.gio_bat_dau);
            const endTime = new Date(shift.gio_ket_thuc);

            const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
            const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

            // Check if current time is within shift hours
            if (currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes) {
                this.logger.log(
                    `Phat hien ca hien tai: ${shift.ten_ca} cho ngay ${vnDay}`
                );
                return this.transformShift(shift);
            }
        }

        this.logger.log(
            `Khong tim thay ca hoat dong nao cho thoi gian hien tai: ${currentHours}:${currentMinutes}, ngay: ${vnDay}`
        );
        return null;
    }

    /**
     * Get shift for a specific time and date
     * Used by check-in/check-out to determine the applicable shift
     *
     * @param idDoanhNghiep - Tenant ID
     * @param date - DateTime to check
     */
    async getShiftForDateTime(idDoanhNghiep: string, date: Date): Promise<any | null> {
        // Get day of week
        const jsDay = date.getDay();
        const vnDay = jsDay === 0 ? 8 : jsDay + 1;

        // Get time as minutes from midnight
        const timeMinutes = date.getHours() * 60 + date.getMinutes();

        // Fetch all active shifts for this tenant
        const shifts = await this.prisma.caLamViec.findMany({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
                trang_thai: 1,
            },
        });

        // Find matching shift
        for (const shift of shifts) {
            const applyDays = parseDaysOfWeek(shift.ap_dung_thu);
            if (!applyDays.includes(vnDay)) {
                continue;
            }

            const startTime = new Date(shift.gio_bat_dau);
            const endTime = new Date(shift.gio_ket_thuc);

            const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
            const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

            // Allow check-in up to 2 hours before shift and 4 hours after shift start
            // Allow check-out up to 4 hours after shift end
            const earlyBuffer = 2 * 60; // 2 hours before
            const lateBuffer = 4 * 60; // 4 hours after

            if (
                timeMinutes >= startMinutes - earlyBuffer &&
                timeMinutes <= endMinutes + lateBuffer
            ) {
                return this.transformShift(shift);
            }
        }

        return null;
    }

    // ============================================================
    // UPDATE - Update shift
    // ============================================================
    async update(idDoanhNghiep: string, id: string, dto: UpdateCaLamViecDto, userId?: string) {
        // Check if shift exists
        const existing = await this.prisma.caLamViec.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Khong tim thay ca lam viec voi ID: ${id}`);
        }

        // Build update data
        const updateData: any = {
            nguoi_cap_nhat_id: userId,
        };

        if (dto.ten_ca !== undefined) {
            updateData.ten_ca = dto.ten_ca;
        }

        if (dto.gio_bat_dau !== undefined) {
            updateData.gio_bat_dau = parseTimeString(dto.gio_bat_dau);
        }

        if (dto.gio_ket_thuc !== undefined) {
            updateData.gio_ket_thuc = parseTimeString(dto.gio_ket_thuc);
        }

        if (dto.ap_dung_thu !== undefined) {
            updateData.ap_dung_thu = dto.ap_dung_thu;
        }

        if (dto.trang_thai !== undefined) {
            updateData.trang_thai = dto.trang_thai;
        }

        // Validate times if both are being updated
        const startTime = updateData.gio_bat_dau || existing.gio_bat_dau;
        const endTime = updateData.gio_ket_thuc || existing.gio_ket_thuc;

        if (startTime >= endTime) {
            throw new BadRequestException(
                'Gio bat dau phai nho hon gio ket thuc'
            );
        }

        const updated = await this.prisma.caLamViec.update({
            where: { id },
            data: updateData,
        });

        this.logger.log(`Cap nhat ca lam viec: ${id}`);
        return this.transformShift(updated);
    }

    // ============================================================
    // REMOVE - Soft delete shift
    // ============================================================
    async remove(idDoanhNghiep: string, id: string, userId?: string) {
        const shift = await this.findOne(idDoanhNghiep, id);

        const deleted = await this.prisma.caLamViec.update({
            where: { id },
            data: {
                ngay_xoa: new Date(),
                nguoi_cap_nhat_id: userId,
            },
        });

        this.logger.log(`Xoa mem ca lam viec: ${shift.ten_ca}`);
        return this.transformShift(deleted);
    }

    // ============================================================
    // RESTORE - Restore soft-deleted shift
    // ============================================================
    async restore(idDoanhNghiep: string, id: string, userId?: string) {
        const shift = await this.prisma.caLamViec.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: { not: null },
            },
        });

        if (!shift) {
            throw new NotFoundException(`Khong tim thay ca lam viec da xoa voi ID: ${id}`);
        }

        const restored = await this.prisma.caLamViec.update({
            where: { id },
            data: {
                ngay_xoa: null,
                nguoi_cap_nhat_id: userId,
            },
        });

        this.logger.log(`Khoi phuc ca lam viec: ${shift.ten_ca}`);
        return this.transformShift(restored);
    }
}
