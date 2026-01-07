/**
 * ============================================================
 * DTOs - CashFlow Module (Phiếu Thu Chi)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 *  LƯU Ý QUAN TRỌNG VỀ DECIMAL:
 * Prisma trả về Prisma.Decimal object, không phải number.
 * Để Frontend dễ xử lý, cần convert sang string/number.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsEnum,
    IsNotEmpty,
    MaxLength,
    IsUUID,
    IsNumber,
    Min,
    IsInt,
    IsDateString,
    IsPositive,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================
// ENUMS - Map với Prisma Enums
// ============================================================

/**
 * Loại phiếu thu/chi - match với Prisma enum LoaiPhieuThuChi
 */
export enum LoaiPhieuThuChi {
    THU = 'thu',
    CHI = 'chi',
}

/**
 * Phương thức thanh toán - match với Prisma enum PhuongThucTT
 */
export enum PhuongThucTT {
    TIEN_MAT = 'tien_mat',
    CHUYEN_KHOAN = 'chuyen_khoan',
    THE = 'the',
}

// ============================================================
// HELPER: Decimal Transform
// ============================================================

/**
 * Transform function để convert string/number thành Decimal-compatible value
 * @internal
 */
function transformToDecimal(value: any): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
}

/**
 * Transform Prisma Decimal output thành number cho response
 * @internal - Export cho service sử dụng
 */
export function decimalToNumberCashFlow(decimal: any): number {
    if (!decimal) return 0;
    if (typeof decimal === 'number') return decimal;
    if (typeof decimal.toNumber === 'function') return decimal.toNumber();
    return parseFloat(String(decimal)) || 0;
}

// ============================================================
// CREATE DTO
// ============================================================

/**
 * DTO để tạo phiếu thu/chi mới
 */
export class CreatePhieuThuChiDto {
    @ApiProperty({
        description: 'Loại phiếu (thu/chi)',
        enum: LoaiPhieuThuChi,
        example: LoaiPhieuThuChi.THU,
    })
    @IsNotEmpty({ message: 'Loại phiếu không được để trống' })
    @IsEnum(LoaiPhieuThuChi, {
        message: 'Loại phiếu phải là "thu" hoặc "chi"',
    })
    loai_phieu: LoaiPhieuThuChi;

    @ApiProperty({
        description: 'Số tiền (phải > 0)',
        example: 1500000,
        minimum: 0.01,
    })
    @IsNotEmpty({ message: 'Số tiền không được để trống' })
    @IsNumber({}, { message: 'Số tiền phải là số' })
    @IsPositive({ message: 'Số tiền phải lớn hơn 0' })
    @Transform(({ value }) => transformToDecimal(value))
    so_tien: number;

    @ApiPropertyOptional({
        description: 'Phương thức thanh toán',
        enum: PhuongThucTT,
        default: PhuongThucTT.TIEN_MAT,
    })
    @IsOptional()
    @IsEnum(PhuongThucTT, {
        message: 'Phương thức thanh toán phải là: tien_mat, chuyen_khoan, hoặc the',
    })
    phuong_thuc?: PhuongThucTT = PhuongThucTT.TIEN_MAT;

    @ApiPropertyOptional({
        description: 'Lý do thu/chi',
        example: 'Thu tiền dịch vụ bảo trì máy lạnh',
        maxLength: 1000,
    })
    @IsOptional()
    @IsString({ message: 'Lý do phải là chuỗi' })
    @Transform(({ value }) => value?.trim())
    ly_do?: string;

    @ApiPropertyOptional({
        description: 'Danh mục (VD: Tiền điện, Lương, Thanh toán HĐ...)',
        example: 'Thanh toán hợp đồng',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Danh mục phải là chuỗi' })
    @MaxLength(100, { message: 'Danh mục tối đa 100 ký tự' })
    @Transform(({ value }) => value?.trim())
    danh_muc?: string;

    @ApiPropertyOptional({
        description: 'Ngày thực hiện (ISO 8601: YYYY-MM-DD). Mặc định là hôm nay.',
        example: '2026-01-07',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Ngày thực hiện phải là chuỗi ngày hợp lệ (YYYY-MM-DD)' })
    ngay_thuc_hien?: string;

    @ApiPropertyOptional({
        description: 'ID công việc liên quan (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID công việc phải là UUID hợp lệ' })
    id_cong_viec?: string;

    @ApiPropertyOptional({
        description: 'ID khách hàng liên quan (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID khách hàng phải là UUID hợp lệ' })
    id_khach_hang?: string;

    @ApiPropertyOptional({
        description: 'URL ảnh chứng từ',
        example: 'https://storage.example.com/receipts/receipt-001.jpg',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'URL ảnh chứng từ phải là chuỗi' })
    @MaxLength(500, { message: 'URL ảnh chứng từ tối đa 500 ký tự' })
    anh_chung_tu?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú',
        example: 'Đã nhận tiền mặt tại văn phòng',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;
}

// ============================================================
// UPDATE DTO
// ============================================================

/**
 * DTO để cập nhật phiếu thu/chi
 * Cho phép sửa: lý do, số tiền, danh mục, phương thức, ảnh chứng từ, ghi chú
 */
export class UpdatePhieuThuChiDto {
    @ApiPropertyOptional({
        description: 'Số tiền mới (phải > 0)',
        example: 2000000,
        minimum: 0.01,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Số tiền phải là số' })
    @IsPositive({ message: 'Số tiền phải lớn hơn 0' })
    @Transform(({ value }) => transformToDecimal(value))
    so_tien?: number;

    @ApiPropertyOptional({
        description: 'Phương thức thanh toán',
        enum: PhuongThucTT,
    })
    @IsOptional()
    @IsEnum(PhuongThucTT, {
        message: 'Phương thức thanh toán phải là: tien_mat, chuyen_khoan, hoặc the',
    })
    phuong_thuc?: PhuongThucTT;

    @ApiPropertyOptional({
        description: 'Lý do thu/chi',
        example: 'Thu tiền dịch vụ bảo trì máy lạnh - cập nhật',
    })
    @IsOptional()
    @IsString({ message: 'Lý do phải là chuỗi' })
    @Transform(({ value }) => value?.trim())
    ly_do?: string;

    @ApiPropertyOptional({
        description: 'Danh mục',
        example: 'Chi phí văn phòng',
        maxLength: 100,
    })
    @IsOptional()
    @IsString({ message: 'Danh mục phải là chuỗi' })
    @MaxLength(100, { message: 'Danh mục tối đa 100 ký tự' })
    @Transform(({ value }) => value?.trim())
    danh_muc?: string;

    @ApiPropertyOptional({
        description: 'URL ảnh chứng từ',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'URL ảnh chứng từ phải là chuỗi' })
    @MaxLength(500, { message: 'URL ảnh chứng từ tối đa 500 ký tự' })
    anh_chung_tu?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú',
    })
    @IsOptional()
    @IsString({ message: 'Ghi chú phải là chuỗi' })
    ghi_chu?: string;
}

// ============================================================
// QUERY DTO
// ============================================================

/**
 * Query params cho danh sách phiếu thu/chi
 */
export class QueryPhieuThuChiDto {
    @ApiPropertyOptional({
        description: 'Số trang',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số items mỗi trang',
        default: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;

    @ApiPropertyOptional({
        description: 'Lọc theo loại phiếu',
        enum: LoaiPhieuThuChi,
    })
    @IsOptional()
    @IsEnum(LoaiPhieuThuChi)
    loai_phieu?: LoaiPhieuThuChi;

    @ApiPropertyOptional({
        description: 'Từ ngày (ISO 8601: YYYY-MM-DD)',
        example: '2026-01-01',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Từ ngày phải là chuỗi ngày hợp lệ' })
    tu_ngay?: string;

    @ApiPropertyOptional({
        description: 'Đến ngày (ISO 8601: YYYY-MM-DD)',
        example: '2026-01-31',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Đến ngày phải là chuỗi ngày hợp lệ' })
    den_ngay?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo ID khách hàng',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID khách hàng phải là UUID hợp lệ' })
    id_khach_hang?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo ID công việc',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID('4', { message: 'ID công việc phải là UUID hợp lệ' })
    id_cong_viec?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo danh mục',
        example: 'Thanh toán hợp đồng',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    danh_muc?: string;

    @ApiPropertyOptional({
        description: 'Lọc theo phương thức thanh toán',
        enum: PhuongThucTT,
    })
    @IsOptional()
    @IsEnum(PhuongThucTT)
    phuong_thuc?: PhuongThucTT;

    @ApiPropertyOptional({
        description: 'Từ khóa tìm kiếm (theo mã phiếu, lý do)',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    search?: string;
}

// ============================================================
// STATS QUERY DTO
// ============================================================

/**
 * Query params cho thống kê tài chính
 */
export class CashFlowStatsQueryDto {
    @ApiPropertyOptional({
        description: 'Từ ngày (ISO 8601: YYYY-MM-DD). Mặc định đầu tháng hiện tại.',
        example: '2026-01-01',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Từ ngày phải là chuỗi ngày hợp lệ' })
    tu_ngay?: string;

    @ApiPropertyOptional({
        description: 'Đến ngày (ISO 8601: YYYY-MM-DD). Mặc định là hôm nay.',
        example: '2026-01-31',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Đến ngày phải là chuỗi ngày hợp lệ' })
    den_ngay?: string;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Response DTO cho khách hàng (embedded)
 */
export class KhachHangCashFlowDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Nguyễn Văn A' })
    ho_ten: string;

    @ApiPropertyOptional({ example: '0901234567' })
    so_dien_thoai?: string;

    @ApiPropertyOptional({ example: 'nguyenvana@email.com' })
    email?: string;
}

/**
 * Response DTO cho công việc (embedded)
 */
export class CongViecCashFlowDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiPropertyOptional({ example: 'CV-001' })
    ma_cong_viec?: string;

    @ApiProperty({ example: 'Bảo trì máy lạnh' })
    tieu_de: string;
}

/**
 * Response DTO cho người dùng (embedded)
 */
export class NguoiDungCashFlowDto {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;

    @ApiProperty({ example: 'Trần Văn B' })
    ho_ten: string;

    @ApiPropertyOptional({ example: 'tranvanb@email.com' })
    email?: string;
}

/**
 * Response DTO cho một phiếu thu/chi
 */
export class PhieuThuChiResponseDto {
    @ApiProperty({ description: 'ID phiếu (UUID)' })
    id: string;

    @ApiProperty({ description: 'Mã phiếu', example: 'PT-1704585600000' })
    ma_phieu: string;

    @ApiProperty({ description: 'Loại phiếu', enum: LoaiPhieuThuChi })
    loai_phieu: LoaiPhieuThuChi;

    @ApiProperty({ description: 'Số tiền (VNĐ)', example: 1500000 })
    so_tien: number;

    @ApiProperty({ description: 'Phương thức thanh toán', enum: PhuongThucTT })
    phuong_thuc: PhuongThucTT;

    @ApiPropertyOptional({ description: 'Lý do' })
    ly_do?: string;

    @ApiPropertyOptional({ description: 'Danh mục' })
    danh_muc?: string;

    @ApiPropertyOptional({ description: 'Ngày thực hiện' })
    ngay_thuc_hien?: Date;

    @ApiPropertyOptional({ description: 'URL ảnh chứng từ' })
    anh_chung_tu?: string;

    @ApiPropertyOptional({ description: 'Ghi chú' })
    ghi_chu?: string;

    @ApiProperty({ description: 'Trạng thái', example: 1 })
    trang_thai: number;

    @ApiProperty({ description: 'ID người tạo phiếu' })
    id_nguoi_dung: string;

    @ApiPropertyOptional({ description: 'ID khách hàng' })
    id_khach_hang?: string;

    @ApiPropertyOptional({ description: 'ID công việc' })
    id_cong_viec?: string;

    @ApiPropertyOptional({ description: 'Thông tin người tạo', type: NguoiDungCashFlowDto })
    nguoi_dung?: NguoiDungCashFlowDto;

    @ApiPropertyOptional({ description: 'Thông tin khách hàng', type: KhachHangCashFlowDto })
    khach_hang?: KhachHangCashFlowDto;

    @ApiPropertyOptional({ description: 'Thông tin công việc', type: CongViecCashFlowDto })
    cong_viec?: CongViecCashFlowDto;

    @ApiProperty({ description: 'Ngày tạo' })
    ngay_tao: Date;

    @ApiProperty({ description: 'Ngày cập nhật' })
    ngay_cap_nhat: Date;
}

/**
 * Response cho danh sách phiếu thu/chi có phân trang
 */
export class PhieuThuChiListResponseDto {
    @ApiProperty({ type: [PhieuThuChiResponseDto] })
    data: PhieuThuChiResponseDto[];

    @ApiProperty({
        description: 'Thông tin phân trang',
        example: { page: 1, limit: 20, total: 100, totalPages: 5 },
    })
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

/**
 * Response cho thống kê dòng tiền
 */
export class CashFlowStatsResponseDto {
    @ApiProperty({ description: 'Tổng thu (VNĐ)', example: 50000000 })
    tong_thu: number;

    @ApiProperty({ description: 'Tổng chi (VNĐ)', example: 30000000 })
    tong_chi: number;

    @ApiProperty({ description: 'Tồn quỹ = Thu - Chi (VNĐ)', example: 20000000 })
    ton_quy: number;

    @ApiProperty({ description: 'Từ ngày', example: '2026-01-01' })
    tu_ngay: string;

    @ApiProperty({ description: 'Đến ngày', example: '2026-01-31' })
    den_ngay: string;

    @ApiProperty({ description: 'Số phiếu thu', example: 25 })
    so_phieu_thu: number;

    @ApiProperty({ description: 'Số phiếu chi', example: 15 })
    so_phieu_chi: number;
}
