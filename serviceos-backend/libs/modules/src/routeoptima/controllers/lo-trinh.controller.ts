/**
 * ============================================================
 * LO TRINH CONTROLLER - RouteOptima Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Endpoints:
 * - POST   /routes                     - Create route with stops
 * - GET    /routes                     - List routes (paginated)
 * - GET    /routes/my-route            - Get my route for today/date
 * - GET    /routes/:id                 - Get route by ID
 * - PATCH  /routes/:id/start           - Start route
 * - PATCH  /routes/:id/cancel          - Cancel route
 * - PATCH  /routes/:id/optimize        - Optimize route order
 * - DELETE /routes/:id                 - Soft delete route
 * - PATCH  /routes/stops/:id/status    - Update stop status
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
import { LoTrinhService } from '../services/lo-trinh.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import {
    CreateLoTrinhDto,
    QueryLoTrinhDto,
    QueryMyRouteDto,
    LoTrinhResponseDto,
    LoTrinhListResponseDto,
} from '../dto/lo-trinh.dto';
import { UpdateStopStatusDto, UpdateStopResponseDto } from '../dto/diem-dung.dto';

@ApiTags('RouteOptima - Lộ Trình (Routes)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(LoTrinhResponseDto, LoTrinhListResponseDto, UpdateStopResponseDto)
@Controller('routes')
export class LoTrinhController {
    constructor(private readonly loTrinhService: LoTrinhService) { }

    // ============================================================
    // POST /routes - Create route with stops
    // ============================================================
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Tạo lộ trình với các điểm dừng',
        description: `
Tạo lộ trình mới với nhiều điểm dừng cho nhân viên.

**Đầu vào:**
- \`ngay_lo_trinh\`: Ngày (YYYY-MM-DD)
- \`nguoi_dung_id\`: ID nhân viên/lái xe
- \`stops\`: Mảng các điểm dừng (cần ít nhất 1)
  - \`thu_tu\`: Thứ tự điểm dừng (1, 2, 3...)
  - \`dia_chi\`: Địa chỉ
  - \`toa_do_lat\`, \`toa_do_lng\`: Tọa độ GPS
  - \`thoi_gian_den_du_kien\`: Thời gian đến dự kiến
  - \`cong_viec_id\`: ID công việc liên quan (tùy chọn)
  - \`ghi_chu\`: Ghi chú

**Tạo:**
- LoTrinh (đầu lộ trình)
- Bản ghi DiemDung (điểm dừng)
        `,
    })
    @ApiBody({ type: CreateLoTrinhDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Lộ trình được tạo thành công',
        type: LoTrinhResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy người dùng hoặc công việc' })
    async create(
        @Body() dto: CreateLoTrinhDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.createRoute(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // GET /routes - List routes
    // ============================================================
    @Get()
    @ApiOperation({
        summary: 'Liệt kê lộ trình',
        description: `
Lấy danh sách lộ trình phân trang.

**Bộ lọc:**
- \`ngay\`: Lọc theo ngày (YYYY-MM-DD)
- \`nguoi_dung_id\`: Lọc theo ID nhân viên
- \`trang_thai\`: 0=Chưa bắt đầu, 1=Đang thực hiện, 2=Hoàn thành, 3=Đã hủy
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách lộ trình',
        type: LoTrinhListResponseDto,
    })
    async findAll(
        @Query() query: QueryLoTrinhDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.findAll(user.id_doanh_nghiep, query);
    }

    // ============================================================
    // GET /routes/my-route - Get my route for today
    // ============================================================
    @Get('my-route')
    @ApiOperation({
        summary: 'Lấy lộ trình của tôi hôm nay',
        description: `
Lấy lộ trình được giao cho người dùng hiện tại đang đăng nhập.

**Đầu vào:**
- \`ngay\`: Ngày tùy chọn (YYYY-MM-DD). Mặc định là hôm nay.

**Đầu ra:**
- Lộ trình với tất cả điểm dừng được sắp xếp theo \`thu_tu\`
- null nếu không có lộ trình cho ngày đó
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Dữ liệu lộ trình của tôi',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/LoTrinhResponseDto' },
            },
        },
    })
    async getMyRoute(
        @Query() query: QueryMyRouteDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.getMyRoute(user.id_doanh_nghiep, query, user.id);
    }

    // ============================================================
    // GET /routes/:id - Get route by ID
    // ============================================================
    @Get(':id')
    @ApiOperation({
        summary: 'Lấy chi tiết lộ trình',
        description: 'Lấy lộ trình với tất cả điểm dừng',
    })
    @ApiParam({ name: 'id', description: 'UUID lộ trình' })
    @ApiResponse({ status: HttpStatus.OK, type: LoTrinhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy lộ trình' })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.findOne(user.id_doanh_nghiep, id);
    }

    // ============================================================
    // PATCH /routes/:id/start - Start route
    // ============================================================
    @Patch(':id/start')
    @ApiOperation({
        summary: 'Bắt đầu lộ trình',
        description: 'Đánh dấu lộ trình đã bắt đầu (IN_PROGRESS). Ghi nhận thời gian bắt đầu.',
    })
    @ApiParam({ name: 'id', description: 'UUID lộ trình' })
    @ApiResponse({ status: HttpStatus.OK, type: LoTrinhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy lộ trình' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Lộ trình đã bắt đầu' })
    async startRoute(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.startRoute(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    // PATCH /routes/:id/cancel - Cancel route
    // ============================================================
    @Patch(':id/cancel')
    @ApiOperation({
        summary: 'Hủy lộ trình',
        description: 'Hủy lộ trình. Không thể hủy lộ trình đã hoàn thành.',
    })
    @ApiParam({ name: 'id', description: 'UUID lộ trình' })
    @ApiResponse({ status: HttpStatus.OK, type: LoTrinhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy lộ trình' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Không thể hủy lộ trình đã hoàn thành' })
    async cancelRoute(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.cancelRoute(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    // PATCH /routes/:id/optimize - Optimize route
    // ============================================================
    @Patch(':id/optimize')
    @ApiOperation({
        summary: 'Tối ưu hóa thứ tự lộ trình',
        description: `
Sắp xếp lại điểm dừng để tối ưu lộ trình.

**Triển khai hiện tại:**
- Placeholder - sắp xếp theo \`thu_tu\` hiện có

**Tương lai:**
- Thuật toán TSP (Traveling Salesman Problem)
- Sử dụng tọa độ GPS để giảm thiểu khoảng cách di chuyển
        `,
    })
    @ApiParam({ name: 'id', description: 'Route UUID' })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/LoTrinhResponseDto' },
                note: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy lộ trình' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Lộ trình đã bắt đầu' })
    async optimizeRoute(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.optimizeRoute(user.id_doanh_nghiep, id);
    }

    // ============================================================
    // DELETE /routes/:id - Soft delete route
    // ============================================================
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa lộ trình (xóa mềm)',
        description: 'Xóa mềm lộ trình và tất cả điểm dừng của nó.',
    })
    @ApiParam({ name: 'id', description: 'UUID lộ trình' })
    @ApiResponse({ status: HttpStatus.OK, type: LoTrinhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy lộ trình' })
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.remove(user.id_doanh_nghiep, id, user.id);
    }

    // ============================================================
    // PATCH /routes/stops/:id/status - Update stop status
    // ============================================================
    @Patch('stops/:id/status')
    @ApiOperation({
        summary: 'Cập nhật trạng thái điểm dừng',
        description: `
Đánh dấu điểm dừng là Đã ghé thăm hoặc Đã bỏ qua.

**Đầu vào:**
- \`trang_thai\`: 1 = Đã ghé thăm, 2 = Đã bỏ qua
- \`thoi_gian_den_thuc_te\`: Thời gian đến thực tế (tùy chọn, mặc định là bây giờ)
- \`toa_do_thuc_te_lat\`, \`toa_do_thuc_te_lng\`: GPS thực tế (tùy chọn)
- \`thoi_gian_roi_di\`: Thời gian rời đi (tùy chọn)

**Hành vi:**
- Nếu trạng thái lộ trình là PENDING, nó sẽ trở thành IN_PROGRESS
- Nếu tất cả điểm dừng đều Đã ghé thăm/Đã bỏ qua, lộ trình sẽ COMPLETED
        `,
    })
    @ApiParam({ name: 'id', description: 'UUID điểm dừng (DiemDung)' })
    @ApiBody({ type: UpdateStopStatusDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Điểm dừng đã cập nhật',
        type: UpdateStopResponseDto,
    })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy điểm dừng' })
    async updateStopStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateStopStatusDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.loTrinhService.updateStopStatus(user.id_doanh_nghiep, id, dto, user.id);
    }
}
