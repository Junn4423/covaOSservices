/**
 * ============================================================
 * CA LAM VIEC CONTROLLER - ShiftSquad Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Endpoints:
 * - POST   /shifts          - Create new shift
 * - GET    /shifts          - List all shifts
 * - GET    /shifts/current  - Get current applicable shift
 * - GET    /shifts/:id      - Get shift by ID
 * - PATCH  /shifts/:id      - Update shift
 * - DELETE /shifts/:id      - Soft delete shift
 * - PATCH  /shifts/:id/restore - Restore deleted shift
 */

import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
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
import { CaLamViecService } from '../services/ca-lam-viec.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import {
    CreateCaLamViecDto,
    UpdateCaLamViecDto,
    QueryCaLamViecDto,
    CaLamViecResponseDto,
    CaLamViecListResponseDto,
} from '../dto/ca-lam-viec.dto';

@ApiTags('ShiftSquad - Ca Làm Việc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(CaLamViecResponseDto, CaLamViecListResponseDto)
@Controller('shifts')
export class CaLamViecController {
    constructor(private readonly caLamViecService: CaLamViecService) { }

    // ============================================================
    // POST /shifts - Tạo ca làm việc mới
    // ============================================================
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Tạo ca làm việc mới',
        description: `
Tạo cấu hình ca làm việc mới.

**Dữ liệu đầu vào:**
- \`ten_ca\`: Tên ca (ví dụ: "Ca Sáng", "Ca Chiều")
- \`gio_bat_dau\`: Giờ bắt đầu theo định dạng HH:mm (24 giờ)
- \`gio_ket_thuc\`: Giờ kết thúc theo định dạng HH:mm (24 giờ)
- \`ap_dung_thu\`: Các ngày trong tuần (phân cách bằng dấu phẩy: 2=Thứ 2, 3=Thứ 3, ..., 8=Chủ nhật)

**Ví dụ:**
- Ca sáng: 08:00 - 12:00, Thứ 2-Chủ nhật: "2,3,4,5,6,7,8"
- Ca chiều: 13:00 - 17:00, Thứ 2-Thứ 7: "2,3,4,5,6,7"
        `,
    })
    @ApiBody({ type: CreateCaLamViecDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Ca làm việc đã được tạo thành công',
        type: CaLamViecResponseDto,
    })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu không hợp lệ hoặc định dạng thời gian sai' })
    async create(
        @Body() dto: CreateCaLamViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.create(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // GET /shifts - Liệt kê tất cả ca làm việc
    // ============================================================
    @Get()
    @ApiOperation({
        summary: 'Liệt kê tất cả ca làm việc',
        description: `
Lấy tất cả ca làm việc đã cấu hình cho tenant.

**Tính năng:**
- Phân trang: page, limit
- Lọc theo trạng thái (hoạt động/không hoạt động)
- Tìm kiếm theo tên
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách ca làm việc',
        type: CaLamViecListResponseDto,
    })
    async findAll(
        @Query() query: QueryCaLamViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.findAll(user.id_doanh_nghiep, query);
    }

    // ============================================================
    // GET /shifts/current - Lấy ca làm việc hiện tại áp dụng
    // ============================================================
    @Get('current')
    @ApiOperation({
        summary: 'Lấy ca làm việc hiện tại áp dụng',
        description: `
Xác định ca làm việc nào áp dụng cho thời gian và ngày trong tuần hiện tại.

**Logic:**
1. Kiểm tra thời gian địa phương hiện tại
2. Kiểm tra ngày trong tuần hiện tại
3. Tìm ca làm việc hoạt động phù hợp với cả hai tiêu chí
4. Trả về thông tin ca hoặc null nếu không tìm thấy

Hữu ích cho:
- Ứng dụng di động để hiển thị ca nào người dùng nên ở trong
- Tự động phát hiện ca cho check-in/check-out
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Ca làm việc hiện tại hoặc null',
        schema: {
            oneOf: [
                { $ref: '#/components/schemas/CaLamViecResponseDto' },
                { type: 'null' },
            ],
        },
    })
    async getCurrentShift(@ActiveUser() user: ActiveUserData) {
        return this.caLamViecService.getCurrentShift(user.id_doanh_nghiep);
    }

    // ============================================================
    // GET /shifts/:id - Lấy chi tiết ca làm việc
    // ============================================================
    @Get(':id')
    @ApiOperation({
        summary: 'Lấy chi tiết ca làm việc',
        description: 'Lấy thông tin chi tiết về một ca làm việc cụ thể',
    })
    @ApiParam({ name: 'id', description: 'UUID ca làm việc' })
    @ApiResponse({ status: HttpStatus.OK, type: CaLamViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy ca làm việc' })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.findOne(user.id_doanh_nghiep, id);
    }

    // ============================================================
    // PATCH /shifts/:id - Cập nhật ca làm việc
    // ============================================================
    @Patch(':id')
    @ApiOperation({
        summary: 'Cập nhật ca làm việc',
        description: `
Cập nhật cấu hình ca làm việc hiện có.

**Các trường có thể cập nhật:**
- \`ten_ca\`: Tên ca
- \`gio_bat_dau\`: Giờ bắt đầu (HH:mm)
- \`gio_ket_thuc\`: Giờ kết thúc (HH:mm)
- \`ap_dung_thu\`: Các ngày trong tuần
- \`trang_thai\`: Trạng thái (1=Hoạt động, 0=Không hoạt động)
        `,
    })
    @ApiParam({ name: 'id', description: 'UUID ca làm việc' })
    @ApiBody({ type: UpdateCaLamViecDto })
    @ApiResponse({ status: HttpStatus.OK, type: CaLamViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy ca làm việc' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu không hợp lệ' })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateCaLamViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.update(user.id_doanh_nghiep, id, dto, user.id);
    }

    // ============================================================
    // DELETE /shifts/:id - Xóa ca làm việc (xóa mềm)
    // ============================================================
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa ca làm việc (xóa mềm)',
        description: `
Xóa mềm một ca làm việc. Ca làm việc có thể được khôi phục sau này.

Lưu ý: Xóa ca làm việc không ảnh hưởng đến các bản ghi chấm công hiện có.
        `,
    })
    @ApiParam({ name: 'id', description: 'UUID ca làm việc' })
    @ApiResponse({ status: HttpStatus.OK, type: CaLamViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy ca làm việc' })
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.remove(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    // PATCH /shifts/:id/restore - Khôi phục ca làm việc đã xóa
    // ============================================================
    @Patch(':id/restore')
    @ApiOperation({
        summary: 'Khôi phục ca làm việc đã xóa',
        description: 'Khôi phục một ca làm việc đã bị xóa mềm trước đó',
    })
    @ApiParam({ name: 'id', description: 'UUID ca làm việc' })
    @ApiResponse({ status: HttpStatus.OK, type: CaLamViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy ca làm việc đã xóa' })
    async restore(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.caLamViecService.restore(user.id_doanh_nghiep, id, user.id);
    }
}
