/**
 * ============================================================
 * CHAM CONG CONTROLLER - ShiftSquad Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Endpoints:
 * - POST   /attendance/check-in      - Employee check-in
 * - POST   /attendance/check-out     - Employee check-out
 * - GET    /attendance/today         - Get today's status (quick check)
 * - GET    /attendance/my-timesheet  - Personal timesheet by month/year
 * - GET    /attendance/daily-report  - Manager: All employees for a day
 * - GET    /attendance/:id           - Get attendance record by ID
 */

import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    HttpStatus,
    HttpCode,
    ParseUUIDPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiBody,
    ApiExtraModels,
} from '@nestjs/swagger';
import { ChamCongService } from '../services/cham-cong.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import {
    CheckInDto,
    CheckOutDto,
    QueryTimesheetDto,
    QueryDailyReportDto,
    ChamCongResponseDto,
    CheckInResponseDto,
    CheckOutResponseDto,
    TimesheetResponseDto,
    DailyReportResponseDto,
} from '../dto/cham-cong.dto';

@ApiTags('ShiftSquad - Chấm Công')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(
    ChamCongResponseDto,
    CheckInResponseDto,
    CheckOutResponseDto,
    TimesheetResponseDto,
    DailyReportResponseDto,
)
@Controller('attendance')
export class ChamCongController {
    constructor(private readonly chamCongService: ChamCongService) { }

    // ============================================================
    // POST /attendance/check-in - Nhân viên check-in
    // ============================================================
    @Post('check-in')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Nhân viên check-in',
        description: `
Nhân viên điểm danh vào ca làm việc.

**Tính năng:**
- Tự động phát hiện ca làm việc hiện tại dựa trên thời gian và ngày
- Ngăn chặn check-in trùng lặp (chỉ một lần check-in mỗi ngày)
- Theo dõi tọa độ GPS để xác minh vị trí
- Hỗ trợ ảnh check-in (URL selfie)
- Tự động đánh dấu "Đi trễ" nếu check-in muộn hơn 15 phút so với giờ bắt đầu ca

**Dữ liệu đầu vào:**
- \`toa_do_lat\`: Vĩ độ (-90 đến 90)
- \`toa_do_lng\`: Kinh độ (-180 đến 180)
- \`anh_checkin\`: URL ảnh (tùy chọn)
- \`ghi_chu\`: Ghi chú (tùy chọn)

**Dữ liệu đầu ra:**
- Xác nhận check-in với thời gian
- Thông tin ca làm việc được phát hiện (nếu có)
- Bản ghi chấm công
        `,
    })
    @ApiBody({ type: CheckInDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Check-in thành công',
        type: CheckInResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Đã check-in hôm nay',
    })
    async checkIn(
        @Body() dto: CheckInDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.checkIn(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // POST /attendance/check-out - Nhân viên check-out
    // ============================================================
    @Post('check-out')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Nhân viên check-out',
        description: `
Nhân viên điểm danh ra ca làm việc.

**Yêu cầu:**
- Phải đã check-in trước đó
- Không thể check-out nhiều lần

**Tính năng:**
- Cập nhật thời gian check-out, vị trí và ảnh
- Tính toán tổng số giờ làm việc
- Đánh dấu "Về sớm" nếu check-out sớm hơn 15 phút so với giờ kết thúc ca

**Dữ liệu đầu vào:**
- \`toa_do_lat\`: Vĩ độ (-90 đến 90)
- \`toa_do_lng\`: Kinh độ (-180 đến 180)
- \`anh_checkout\`: URL ảnh (tùy chọn)

**Dữ liệu đầu ra:**
- Xác nhận check-out với thời gian
- Số giờ làm việc đã tính
- Bản ghi chấm công đã cập nhật
        `,
    })
    @ApiBody({ type: CheckOutDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Check-out thành công',
        type: CheckOutResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Chưa check-in hoặc đã check-out',
    })
    async checkOut(
        @Body() dto: CheckOutDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.checkOut(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // GET /attendance/today - Kiểm tra trạng thái nhanh
    // ============================================================
    @Get('today')
    @ApiOperation({
        summary: 'Lấy trạng thái chấm công hôm nay',
        description: `
Kiểm tra nhanh trạng thái chấm công hôm nay.

Hữu ích cho ứng dụng di động để xác định:
- Có nên hiển thị nút "Check-in"? (chưa check-in)
- Có nên hiển thị nút "Check-out"? (đã check-in nhưng chưa check-out)
- Đã hoàn thành cho hôm nay? (cả hai đã xong)

**Dữ liệu đầu ra:**
- \`status\`: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT'
- \`can_checkin\`: boolean
- \`can_checkout\`: boolean
- \`data\`: Bản ghi chấm công (nếu có)
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: {
                status: {
                    type: 'string',
                    enum: ['NOT_CHECKED_IN', 'CHECKED_IN', 'CHECKED_OUT'],
                },
                can_checkin: { type: 'boolean' },
                can_checkout: { type: 'boolean' },
                data: { $ref: '#/components/schemas/ChamCongResponseDto' },
            },
        },
    })
    async getTodayStatus(@ActiveUser() user: ActiveUserData) {
        return this.chamCongService.getTodayStatus(user.id_doanh_nghiep, user.id);
    }

    // ============================================================
    // GET /attendance/my-timesheet - Bảng chấm công cá nhân
    // ============================================================
    @Get('my-timesheet')
    @ApiOperation({
        summary: 'Lấy bảng chấm công cá nhân',
        description: `
Lấy bản ghi chấm công cho một tháng/năm cụ thể.

**Dữ liệu đầu vào:**
- \`thang\`: Tháng (1-12)
- \`nam\`: Năm (ví dụ: 2026)

**Dữ liệu đầu ra:**
- Danh sách bản ghi chấm công trong tháng
- Thống kê tổng hợp:
  - \`tong_ngay_lam\`: Tổng số ngày làm việc
  - \`tong_gio_lam\`: Tổng số giờ làm việc
  - \`so_ngay_di_tre\`: Số ngày đi trễ
  - \`so_ngay_vang\`: Số ngày vắng mặt
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Dữ liệu bảng chấm công',
        type: TimesheetResponseDto,
    })
    async getMyTimesheet(
        @Query() query: QueryTimesheetDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.getMyTimesheet(user.id_doanh_nghiep, query, user.id);
    }

    // ============================================================
    // GET /attendance/daily-report - Báo cáo hàng ngày (Quản lý)
    // ============================================================
    @Get('daily-report')
    @ApiOperation({
        summary: 'Lấy báo cáo chấm công hàng ngày (Quản lý)',
        description: `
Lấy trạng thái chấm công của tất cả nhân viên trong một ngày cụ thể.

**Dành cho Quản lý/Admin.**

**Dữ liệu đầu vào:**
- \`ngay\`: Ngày (định dạng YYYY-MM-DD)
- \`page\`: Số trang (mặc định: 1)
- \`limit\`: Số mục mỗi trang (mặc định: 50)

**Dữ liệu đầu ra:**
- Danh sách nhân viên với trạng thái:
  - \`trang_thai_text\`: 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_LEAVE' | 'NOT_CHECKED_IN'
  - Thời gian check-in/out
  - Số giờ làm việc
  - Thông tin ca làm
- Tổng hợp:
  - \`tong_nhan_vien\`: Tổng số nhân viên
  - \`co_mat\`: Số lượng có mặt
  - \`vang_mat\`: Số lượng vắng mặt
  - \`di_tre\`: Số lượng đi trễ
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Dữ liệu báo cáo hàng ngày',
        type: DailyReportResponseDto,
    })
    async getDailyReport(
        @Query() query: QueryDailyReportDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.getDailyReport(user.id_doanh_nghiep, query);
    }

    // ============================================================
    // GET /attendance/:id - Lấy bản ghi theo ID
    // ============================================================
    @Get(':id')
    @ApiOperation({
        summary: 'Lấy bản ghi chấm công theo ID',
        description: 'Lấy thông tin chi tiết về một bản ghi chấm công cụ thể',
    })
    @ApiParam({ name: 'id', description: 'UUID bản ghi chấm công' })
    @ApiResponse({ status: HttpStatus.OK, type: ChamCongResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy bản ghi' })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.chamCongService.findOne(user.id_doanh_nghiep, id);
    }
}
