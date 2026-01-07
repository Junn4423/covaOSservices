/**
 * ============================================================
 * CHAM CONG SERVICE - ShiftSquad Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Timekeeping Service:
 * - Check-in: Employee clock-in with location & photo
 * - Check-out: Employee clock-out with location & photo
 * - getMyTimesheet: Personal attendance records by month/year
 * - getDailyReport: Manager view of all employees for a specific day
 *
 * Business Rules:
 * - Prevent double check-in on same day
 * - Auto-detect current shift via CaLamViecService
 * - Calculate working hours on check-out
 * - Track late arrival based on shift start time
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
import { CaLamViecService } from './ca-lam-viec.service';
import {
    CheckInDto,
    CheckOutDto,
    QueryTimesheetDto,
    QueryDailyReportDto,
    TrangThaiChamCong,
    calculateWorkingHours,
    mapStatusToText,
} from '../dto/cham-cong.dto';
import { formatTimeToString } from '../dto/ca-lam-viec.dto';

@Injectable()
export class ChamCongService {
    private readonly logger = new Logger(ChamCongService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly caLamViecService: CaLamViecService,
    ) { }

    // ============================================================
    // INCLUDE RELATIONS
    // ============================================================
    private readonly includeRelations = {
        nguoi_dung: {
            select: {
                id: true,
                ho_ten: true,
                email: true,
                phong_ban: true,
            },
        },
        ca_lam_viec: {
            select: {
                id: true,
                ten_ca: true,
                gio_bat_dau: true,
                gio_ket_thuc: true,
            },
        },
    };

    // ============================================================
    // HELPER: Transform attendance record
    // ============================================================
    private transformRecord(record: any) {
        if (!record) return record;

        // Calculate working hours if both check-in and check-out exist
        let soGioLam: number | undefined;
        if (record.gio_checkin && record.gio_checkout) {
            soGioLam = calculateWorkingHours(
                new Date(record.gio_checkin),
                new Date(record.gio_checkout)
            );
        }

        return {
            ...record,
            so_gio_lam: soGioLam,
            // Transform coordinates from Decimal to number
            toa_do_checkin_lat: record.toa_do_checkin_lat?.toNumber?.() ?? record.toa_do_checkin_lat,
            toa_do_checkin_lng: record.toa_do_checkin_lng?.toNumber?.() ?? record.toa_do_checkin_lng,
            toa_do_checkout_lat: record.toa_do_checkout_lat?.toNumber?.() ?? record.toa_do_checkout_lat,
            toa_do_checkout_lng: record.toa_do_checkout_lng?.toNumber?.() ?? record.toa_do_checkout_lng,
            // Transform shift time if present
            ca_lam_viec: record.ca_lam_viec
                ? {
                    ...record.ca_lam_viec,
                    gio_bat_dau: formatTimeToString(record.ca_lam_viec.gio_bat_dau),
                    gio_ket_thuc: formatTimeToString(record.ca_lam_viec.gio_ket_thuc),
                }
                : undefined,
        };
    }

    private transformRecordList(records: any[]) {
        return records.map((r) => this.transformRecord(r));
    }

    // ============================================================
    // HELPER: Get today's date at midnight (local timezone)
    // ============================================================
    private getTodayDate(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    // ============================================================
    // CHECK-IN - Employee clock-in
    // ============================================================
    /**
     * Employee check-in
     *
     * @param idDoanhNghiep - Tenant ID
     * @param dto - CheckInDto
     * @param userId - User ID
     *
     * Flow:
     * 1. Check if user already checked in today (prevent double check-in)
     * 2. Detect current shift using CaLamViecService
     * 3. Determine if employee is late
     * 4. Create attendance record
     * 5. Return check-in confirmation
     */
    async checkIn(idDoanhNghiep: string, dto: CheckInDto, userId: string) {
        const now = new Date();
        const todayDate = this.getTodayDate();

        // 1. Check for existing check-in today
        const existingRecord = await this.prisma.chamCong.findFirst({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                id_nguoi_dung: userId,
                ngay_lam_viec: todayDate,
                ngay_xoa: null,
            },
        });

        if (existingRecord) {
            if (existingRecord.gio_checkin) {
                throw new ConflictException(
                    'Ban da check-in hom nay roi. Khong the check-in lan nua.'
                );
            }
        }

        // 2. Detect current shift
        const currentShift = await this.caLamViecService.getShiftForDateTime(idDoanhNghiep, now);

        // 3. Determine status (late check?)
        let trangThai = TrangThaiChamCong.DA_CHECKIN;

        if (currentShift) {
            const shiftStart = new Date(currentShift.gio_bat_dau);
            const shiftStartMinutes = shiftStart.getHours() * 60 + shiftStart.getMinutes();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // If check-in is more than 15 minutes after shift start, mark as late
            if (currentMinutes > shiftStartMinutes + 15) {
                trangThai = TrangThaiChamCong.TRE;
                this.logger.log(`Nguoi dung ${userId} check-in tre`);
            }
        }

        // 4. Create or update attendance record
        const recordId = existingRecord?.id || uuidv4();

        const data: any = {
            gio_checkin: now,
            toa_do_checkin_lat: dto.toa_do_lat,
            toa_do_checkin_lng: dto.toa_do_lng,
            anh_checkin: dto.anh_checkin,
            ghi_chu: dto.ghi_chu,
            trang_thai: trangThai,
            id_ca_lam_viec: currentShift?.id || null,
        };

        let record;
        if (existingRecord) {
            record = await this.prisma.chamCong.update({
                where: { id: existingRecord.id },
                data,
                include: this.includeRelations,
            });
        } else {
            record = await this.prisma.chamCong.create({
                data: {
                    id: recordId,
                    id_doanh_nghiep: idDoanhNghiep,
                    id_nguoi_dung: userId,
                    ngay_lam_viec: todayDate,
                    ...data,
                } as any,
                include: this.includeRelations,
            });
        }

        this.logger.log(
            `Nguoi dung ${userId} check-in luc ${now.toISOString()}, ca: ${currentShift?.ten_ca || 'Khong co'}`
        );

        return {
            message: 'Check-in thanh cong',
            gio_checkin: now,
            ca_lam_viec: currentShift
                ? {
                    id: currentShift.id,
                    ten_ca: currentShift.ten_ca,
                    gio_bat_dau: currentShift.gio_bat_dau_str,
                    gio_ket_thuc: currentShift.gio_ket_thuc_str,
                }
                : undefined,
            data: this.transformRecord(record),
        };
    }

    // ============================================================
    // CHECK-OUT - Employee clock-out
    // ============================================================
    /**
     * Employee check-out
     *
     * @param idDoanhNghiep - Tenant ID
     * @param dto - CheckOutDto
     * @param userId - User ID
     *
     * Flow:
     * 1. Find active check-in record for today (where gio_checkout is null)
     * 2. Validate user has checked in first
     * 3. Update check-out time, location, and photo
     * 4. Calculate working hours
     * 5. Determine if employee left early
     * 6. Return check-out confirmation
     */
    async checkOut(idDoanhNghiep: string, dto: CheckOutDto, userId: string) {
        const now = new Date();
        const todayDate = this.getTodayDate();

        // 1. Find active check-in record
        const record = await this.prisma.chamCong.findFirst({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                id_nguoi_dung: userId,
                ngay_lam_viec: todayDate,
                gio_checkin: { not: null },
                gio_checkout: null,
                ngay_xoa: null,
            },
            include: this.includeRelations,
        });

        // 2. Validate
        if (!record) {
            throw new BadRequestException(
                'Ban chua check-in hom nay hoac da check-out roi.'
            );
        }

        // 3. Determine status
        let trangThai = TrangThaiChamCong.DA_CHECKOUT;

        if (record.ca_lam_viec) {
            const shiftEnd = new Date(record.ca_lam_viec.gio_ket_thuc);
            const shiftEndMinutes = shiftEnd.getHours() * 60 + shiftEnd.getMinutes();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            // If check-out is more than 15 minutes before shift end, mark as early leave
            if (currentMinutes < shiftEndMinutes - 15) {
                trangThai = TrangThaiChamCong.VE_SOM;
                this.logger.log(`Nguoi dung ${userId} ve som`);
            }
        }

        // 4. Update record
        const updated = await this.prisma.chamCong.update({
            where: { id: record.id },
            data: {
                gio_checkout: now,
                toa_do_checkout_lat: dto.toa_do_lat,
                toa_do_checkout_lng: dto.toa_do_lng,
                anh_checkout: dto.anh_checkout,
                ghi_chu: dto.ghi_chu || record.ghi_chu,
                trang_thai: trangThai,
            },
            include: this.includeRelations,
        });

        // 5. Calculate working hours
        const soGioLam = calculateWorkingHours(
            new Date(record.gio_checkin!),
            now
        );

        this.logger.log(
            `Nguoi dung ${userId} check-out luc ${now.toISOString()}, lam viec ${soGioLam} gio`
        );

        return {
            message: 'Check-out thanh cong',
            gio_checkout: now,
            so_gio_lam: soGioLam,
            data: this.transformRecord(updated),
        };
    }

    // ============================================================
    // GET MY TIMESHEET - Personal attendance records
    // ============================================================
    /**
     * Get personal timesheet for a specific month/year
     *
     * @param idDoanhNghiep - Tenant ID
     * @param query - QueryTimesheetDto
     * @param userId - User ID
     *
     * Returns:
     * - List of attendance records for the month
     * - Summary statistics (total days, hours, late count, absent count)
     */
    async getMyTimesheet(idDoanhNghiep: string, query: QueryTimesheetDto, userId: string) {
        const { thang, nam } = query;

        // Calculate date range for the month
        const startDate = new Date(nam, thang - 1, 1);
        const endDate = new Date(nam, thang, 0); // Last day of month

        // Fetch records
        const records = await this.prisma.chamCong.findMany({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                id_nguoi_dung: userId,
                ngay_lam_viec: {
                    gte: startDate,
                    lte: endDate,
                },
                ngay_xoa: null,
            },
            include: this.includeRelations,
            orderBy: { ngay_lam_viec: 'asc' },
        });

        // Calculate summary
        let tongGioLam = 0;
        let soNgayDiTre = 0;
        let soNgayVang = 0;

        for (const record of records) {
            if (record.gio_checkin && record.gio_checkout) {
                tongGioLam += calculateWorkingHours(
                    new Date(record.gio_checkin),
                    new Date(record.gio_checkout)
                );
            }

            if (record.trang_thai === TrangThaiChamCong.TRE) {
                soNgayDiTre++;
            }

            if (record.trang_thai === TrangThaiChamCong.VANG_MAT) {
                soNgayVang++;
            }
        }

        return {
            data: this.transformRecordList(records),
            summary: {
                thang,
                nam,
                tong_ngay_lam: records.filter(r => r.gio_checkin).length,
                tong_gio_lam: Math.round(tongGioLam * 100) / 100,
                so_ngay_di_tre: soNgayDiTre,
                so_ngay_vang: soNgayVang,
            },
        };
    }

    // ============================================================
    // GET DAILY REPORT - Manager view
    // ============================================================
    /**
     * Get daily attendance report for all employees
     * For Manager/Admin use
     *
     * @param idDoanhNghiep - Tenant ID
     * @param query - QueryDailyReportDto
     *
     * Returns:
     * - List of all employees with their attendance status
     * - Summary (present, absent, late counts)
     */
    async getDailyReport(idDoanhNghiep: string, query: QueryDailyReportDto) {
        const { ngay, page = 1, limit = 50 } = query;
        const skip = (page - 1) * limit;

        const reportDate = new Date(ngay);
        reportDate.setHours(0, 0, 0, 0);

        // Get all active employees for this tenant
        const [employees, totalEmployees] = await Promise.all([
            this.prisma.nguoiDung.findMany({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                    trang_thai: 1,
                },
                skip,
                take: limit,
                select: {
                    id: true,
                    ho_ten: true,
                    email: true,
                    phong_ban: true,
                },
            }),
            this.prisma.nguoiDung.count({
                where: {
                    id_doanh_nghiep: idDoanhNghiep,
                    ngay_xoa: null,
                    trang_thai: 1,
                },
            }),
        ]);

        // Get attendance records for the date
        const attendanceRecords = await this.prisma.chamCong.findMany({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                ngay_lam_viec: reportDate,
                ngay_xoa: null,
            },
            include: {
                ca_lam_viec: {
                    select: {
                        id: true,
                        ten_ca: true,
                        gio_bat_dau: true,
                        gio_ket_thuc: true,
                    },
                },
            },
        });

        // Create a map of user ID to attendance record
        const attendanceMap = new Map(
            attendanceRecords.map(r => [r.id_nguoi_dung, r])
        );

        // Build report data
        let coMat = 0;
        let vangMat = 0;
        let diTre = 0;

        const reportData = employees.map(emp => {
            const record = attendanceMap.get(emp.id);

            let trangThaiText = 'ABSENT';
            let soGioLam: number | undefined;

            if (record) {
                if (record.gio_checkin) {
                    coMat++;
                    trangThaiText = mapStatusToText(record.trang_thai);

                    if (record.trang_thai === TrangThaiChamCong.TRE) {
                        diTre++;
                    }

                    if (record.gio_checkout) {
                        soGioLam = calculateWorkingHours(
                            new Date(record.gio_checkin),
                            new Date(record.gio_checkout)
                        );
                    }
                } else {
                    vangMat++;
                }
            } else {
                vangMat++;
            }

            return {
                nguoi_dung: emp,
                trang_thai_text: trangThaiText,
                gio_checkin: record?.gio_checkin,
                gio_checkout: record?.gio_checkout,
                so_gio_lam: soGioLam,
                ca_lam_viec: record?.ca_lam_viec
                    ? {
                        id: record.ca_lam_viec.id,
                        ten_ca: record.ca_lam_viec.ten_ca,
                        gio_bat_dau: formatTimeToString(record.ca_lam_viec.gio_bat_dau),
                        gio_ket_thuc: formatTimeToString(record.ca_lam_viec.gio_ket_thuc),
                    }
                    : undefined,
            };
        });

        return {
            data: reportData,
            summary: {
                ngay,
                tong_nhan_vien: totalEmployees,
                co_mat: coMat,
                vang_mat: vangMat,
                di_tre: diTre,
            },
            meta: {
                page,
                limit,
                total: totalEmployees,
                totalPages: Math.ceil(totalEmployees / limit),
            },
        };
    }

    // ============================================================
    // GET TODAY STATUS - Quick check for mobile
    // ============================================================
    /**
     * Get current user's attendance status for today
     * Used by mobile app to show check-in/check-out button
     *
     * @param idDoanhNghiep - Tenant ID
     * @param userId - User ID
     */
    async getTodayStatus(idDoanhNghiep: string, userId: string) {
        const todayDate = this.getTodayDate();

        const record = await this.prisma.chamCong.findFirst({
            where: {
                id_doanh_nghiep: idDoanhNghiep,
                id_nguoi_dung: userId,
                ngay_lam_viec: todayDate,
                ngay_xoa: null,
            },
            include: this.includeRelations,
        });

        if (!record) {
            return {
                status: 'NOT_CHECKED_IN',
                can_checkin: true,
                can_checkout: false,
                data: null,
            };
        }

        const hasCheckedIn = !!record.gio_checkin;
        const hasCheckedOut = !!record.gio_checkout;

        return {
            status: hasCheckedOut
                ? 'CHECKED_OUT'
                : hasCheckedIn
                    ? 'CHECKED_IN'
                    : 'NOT_CHECKED_IN',
            can_checkin: !hasCheckedIn,
            can_checkout: hasCheckedIn && !hasCheckedOut,
            data: this.transformRecord(record),
        };
    }

    // ============================================================
    // FIND ONE - Get attendance record by ID
    // ============================================================
    async findOne(idDoanhNghiep: string, id: string) {
        const record = await this.prisma.chamCong.findFirst({
            where: {
                id,
                id_doanh_nghiep: idDoanhNghiep,
                ngay_xoa: null,
            },
            include: this.includeRelations,
        });

        if (!record) {
            throw new NotFoundException(`Khong tim thay ban ghi cham cong voi ID: ${id}`);
        }

        return this.transformRecord(record);
    }
}
