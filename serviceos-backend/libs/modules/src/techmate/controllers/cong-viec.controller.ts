/**
 * ============================================================
 * CÔNG VIỆC CONTROLLER - TechMate Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Endpoints:
 * 
 * # Job Management
 * - POST   /techmate/cong-viec           - Tạo công việc mới
 * - GET    /techmate/cong-viec           - Danh sách công việc (filter + pagination)
 * - GET    /techmate/cong-viec/my-jobs   - Công việc của tôi (Mobile API)
 * - GET    /techmate/cong-viec/stats     - Thống kê công việc
 * - GET    /techmate/cong-viec/count     - Đếm tổng số công việc
 * - GET    /techmate/cong-viec/:id       - Chi tiết công việc
 * - PATCH  /techmate/cong-viec/:id       - Cập nhật công việc
 * - PATCH  /techmate/cong-viec/:id/status - Chuyển trạng thái
 * - DELETE /techmate/cong-viec/:id       - Xóa công việc (soft delete)
 * - PATCH  /techmate/cong-viec/:id/restore - Khôi phục công việc
 * 
 * # Assignments (Phân công)
 * - POST   /techmate/cong-viec/:id/phan-cong           - Phân công nhân viên
 * - GET    /techmate/cong-viec/:id/phan-cong           - Danh sách phân công
 * - DELETE /techmate/cong-viec/:id/phan-cong/:userId   - Gỡ phân công
 * - POST   /techmate/cong-viec/:id/accept              - Nhận việc (Mobile)
 * - POST   /techmate/cong-viec/:id/start               - Bắt đầu làm (Mobile)
 * - POST   /techmate/cong-viec/:id/complete-my-part    - Hoàn thành phần việc (Mobile)
 * 
 * # Evidence (Nghiệm thu hình ảnh)
 * - POST   /techmate/cong-viec/:id/evidence     - Thêm ảnh nghiệm thu
 * - GET    /techmate/cong-viec/:id/evidence     - Danh sách ảnh
 * - DELETE /techmate/evidence/:imageId          - Xóa ảnh
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
    ApiQuery,
} from '@nestjs/swagger';
import { CongViecService } from '../services/cong-viec.service';
import { PhanCongService } from '../services/phan-cong.service';
import { NghiemThuHinhAnhService } from '../services/nghiem-thu-hinh-anh.service';
import { JwtAuthGuard, ActiveUser, ActiveUserData, TenantId } from '@libs/common';
import {
    CreateCongViecDto,
    UpdateCongViecDto,
    QueryCongViecDto,
    UpdateStatusDto,
    CongViecResponseDto,
    CongViecListResponseDto,
    TrangThaiCongViec,
} from '../dto/cong-viec.dto';
import {
    AssignStaffDto,
    PhanCongResponseDto,
    PhanCongListResponseDto,
} from '../dto/phan-cong.dto';
import {
    AddEvidenceDto,
    BulkAddEvidenceDto,
    QueryNghiemThuHinhAnhDto,
    NghiemThuHinhAnhResponseDto,
    NghiemThuHinhAnhListResponseDto,
} from '../dto/nghiem-thu-hinh-anh.dto';

@ApiTags('TechMate - Công Việc')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiExtraModels(
    CongViecResponseDto,
    CongViecListResponseDto,
    PhanCongResponseDto,
    NghiemThuHinhAnhResponseDto,
)
@Controller('techmate/cong-viec')
export class CongViecController {
    constructor(
        private readonly congViecService: CongViecService,
        private readonly phanCongService: PhanCongService,
        private readonly nghiemThuService: NghiemThuHinhAnhService,
    ) { }

    // ============================================================
    // SECTION: JOB MANAGEMENT
    // ============================================================

    // ----------------------------------------
    // POST /techmate/cong-viec - Tạo công việc mới
    // ----------------------------------------
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Tạo công việc mới',
        description: `
Tạo công việc mới trong hệ thống.

**Tính năng tự động:**
- \`ma_cong_viec\` tự động sinh: **CV-{Timestamp}** (VD: CV-1704585600000)
- \`trang_thai\` mặc định: **0 (Mới tạo)**

**Validation:**
- \`tieu_de\` bắt buộc, tối đa 255 ký tự
- \`ngay_hen\` phải >= ngày hiện tại
- \`id_khach_hang\` nếu có phải tồn tại trong hệ thống
        `,
    })
    @ApiBody({ type: CreateCongViecDto })
    @ApiResponse({ status: HttpStatus.CREATED, type: CongViecResponseDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dữ liệu không hợp lệ / Ngày hẹn không hợp lệ' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Khách hàng không tồn tại' })
    async create(
        @Body() dto: CreateCongViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.create(dto, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // GET /techmate/cong-viec - Danh sách công việc
    // ----------------------------------------
    @Get()
    @ApiOperation({
        summary: 'Danh sách công việc',
        description: `
Lấy danh sách công việc với các tính năng:

**Phân trang:** page, limit (mặc định 20)

**Lọc đa dạng:**
- \`trang_thai\`: 0 (Mới tạo), 1 (Đang thực hiện), 2 (Hoàn thành), 3 (Hủy)
- \`id_khach_hang\`: UUID khách hàng
- \`tu_ngay\`, \`den_ngay\`: Khoảng ngày hẹn
- \`do_uu_tien\`: 1-4 (Thấp đến Khẩn cấp)
- \`search\`: Tìm theo tiêu đề hoặc mã CV

Response bao gồm thông tin khách hàng và danh sách phân công.
        `,
    })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecListResponseDto })
    async findAll(
        @Query() query: QueryCongViecDto,
        @TenantId() tenantId: string,
    ) {
        return this.congViecService.findAll(query, tenantId);
    }

    // ----------------------------------------
    // GET /techmate/cong-viec/my-jobs - Công việc của tôi (Mobile API)
    // ----------------------------------------
    @Get('my-jobs')
    @ApiOperation({
        summary: ' Công việc của tôi (Mobile API)',
        description: `
**API đặc biệt cho Mobile App của nhân viên.**

Lấy danh sách công việc mà user đang login được phân công.
- Tìm trong bảng PhanCong where id_nguoi_dung = currentUser.id
- Bao gồm thông tin phân công của user (vai trò, trạng thái)
        `,
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'trang_thai', required: false, enum: TrangThaiCongViec })
    @ApiQuery({ name: 'tu_ngay', required: false, type: String })
    @ApiQuery({ name: 'den_ngay', required: false, type: String })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecListResponseDto })
    async getMyJobs(
        @ActiveUser() user: ActiveUserData,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('trang_thai') trang_thai?: TrangThaiCongViec,
        @Query('tu_ngay') tu_ngay?: string,
        @Query('den_ngay') den_ngay?: string,
    ) {
        return this.congViecService.getMyJobs(user.id, user.id_doanh_nghiep, {
            page,
            limit,
            trang_thai,
            tu_ngay,
            den_ngay,
        });
    }

    // ----------------------------------------
    // GET /techmate/cong-viec/stats - Thống kê
    // ----------------------------------------
    @Get('stats')
    @ApiOperation({
        summary: 'Thống kê công việc',
        description: 'Báo cáo tổng quan: tổng số, phân bổ theo trạng thái và độ ưu tiên',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: {
                total: { type: 'number', example: 100 },
                by_status: {
                    type: 'object',
                    example: { '0': 20, '1': 50, '2': 25, '3': 5 },
                },
                by_priority: {
                    type: 'object',
                    example: { '1': 10, '2': 60, '3': 25, '4': 5 },
                },
            },
        },
    })
    async getStats(@TenantId() tenantId: string) {
        return this.congViecService.getStats(tenantId);
    }

    // ----------------------------------------
    // GET /techmate/cong-viec/count
    // ----------------------------------------
    @Get('count')
    @ApiOperation({ summary: 'Đếm tổng số công việc' })
    @ApiResponse({
        status: HttpStatus.OK,
        schema: {
            type: 'object',
            properties: { count: { type: 'number', example: 150 } },
        },
    })
    async count(@TenantId() tenantId: string) {
        const count = await this.congViecService.count(tenantId);
        return { count };
    }

    // ----------------------------------------
    // GET /techmate/cong-viec/:id - Chi tiết
    // ----------------------------------------
    @Get(':id')
    @ApiOperation({
        summary: 'Chi tiết công việc',
        description: 'Lấy thông tin chi tiết kèm khách hàng, phân công, và ảnh nghiệm thu',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy công việc' })
    async findOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.congViecService.findOne(id, tenantId);
    }

    // ----------------------------------------
    // PATCH /techmate/cong-viec/:id - Cập nhật
    // ----------------------------------------
    @Patch(':id')
    @ApiOperation({
        summary: 'Cập nhật công việc',
        description: 'Cập nhật thông tin công việc (không thể thay đổi mã công việc)',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiBody({ type: UpdateCongViecDto })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy công việc' })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateCongViecDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.update(id, dto, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // PATCH /techmate/cong-viec/:id/status - Chuyển trạng thái
    // ----------------------------------------
    @Patch(':id/status')
    @ApiOperation({
        summary: 'Chuyển trạng thái công việc',
        description: `
**Luồng trạng thái:**
- MOI_TAO (0) → DANG_THUC_HIEN (1) → HOAN_THANH (2)
- Có thể HUY (3) từ bất kỳ trạng thái nào (trừ HOAN_THANH)

**Tự động:**
- Khi chuyển sang HOAN_THANH → \`ngay_hoan_thanh = now()\`
        `,
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiBody({ type: UpdateStatusDto })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Chuyển trạng thái không hợp lệ' })
    async updateStatus(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: UpdateStatusDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.updateStatus(id, dto.trang_thai, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // DELETE /techmate/cong-viec/:id - Xóa (soft delete)
    // ----------------------------------------
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa công việc (soft delete)',
        description: 'Xóa mềm công việc. Có thể khôi phục bằng API restore.',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy công việc' })
    async remove(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.remove(id, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // PATCH /techmate/cong-viec/:id/restore - Khôi phục
    // ----------------------------------------
    @Patch(':id/restore')
    @ApiOperation({
        summary: 'Khôi phục công việc đã xóa',
        description: 'Khôi phục công việc đã bị soft delete',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc đã xóa' })
    @ApiResponse({ status: HttpStatus.OK, type: CongViecResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy công việc đã xóa' })
    async restore(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.congViecService.restore(id, user.id, user.id_doanh_nghiep);
    }

    // ============================================================
    // SECTION: ASSIGNMENTS (Phân công)
    // ============================================================

    // ----------------------------------------
    // POST /techmate/cong-viec/:id/phan-cong - Phân công nhân viên
    // ----------------------------------------
    @Post(':id/phan-cong')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Phân công nhân viên vào công việc',
        description: `
Phân công nhân viên thực hiện công việc.

**Validation:**
- Không được phân công trùng lặp (1 nhân viên chỉ được phân công 1 lần vào 1 công việc)
- Mỗi công việc chỉ có 1 trưởng nhóm
- Nhân viên phải active và cùng doanh nghiệp
        `,
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiBody({ type: AssignStaffDto })
    @ApiResponse({ status: HttpStatus.CREATED, type: PhanCongResponseDto })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Nhân viên đã được phân công / Đã có trưởng nhóm' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Công việc hoặc nhân viên không tồn tại' })
    async assignStaff(
        @Param('id', new ParseUUIDPipe()) jobId: string,
        @Body() dto: AssignStaffDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.phanCongService.assignStaff(jobId, dto, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // GET /techmate/cong-viec/:id/phan-cong - Danh sách phân công
    // ----------------------------------------
    @Get(':id/phan-cong')
    @ApiOperation({
        summary: 'Danh sách phân công của công việc',
        description: 'Lấy danh sách nhân viên được phân công vào công việc',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiResponse({ status: HttpStatus.OK, type: PhanCongListResponseDto })
    async getAssignments(
        @Param('id', new ParseUUIDPipe()) jobId: string,
        @TenantId() tenantId: string,
    ) {
        return this.phanCongService.getByJob(jobId, tenantId);
    }

    // ----------------------------------------
    // DELETE /techmate/cong-viec/:id/phan-cong/:userId - Gỡ phân công
    // ----------------------------------------
    @Delete(':id/phan-cong/:userId')
    @ApiOperation({
        summary: 'Gỡ phân công nhân viên',
        description: 'Hủy phân công nhân viên khỏi công việc',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiParam({ name: 'userId', description: 'UUID nhân viên' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Gỡ phân công thành công' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy phân công' })
    async removeStaff(
        @Param('id', new ParseUUIDPipe()) jobId: string,
        @Param('userId', new ParseUUIDPipe()) staffId: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.phanCongService.removeStaff(jobId, staffId, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // POST /techmate/cong-viec/:id/accept - Nhận việc (Mobile API)
    // ----------------------------------------
    @Post(':id/accept')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: ' Nhận công việc (Mobile API)',
        description: 'Nhân viên xác nhận nhận công việc được phân công',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Nhận việc thành công' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Công việc không được phân công cho bạn' })
    async acceptJob(
        @Param('id', new ParseUUIDPipe()) jobId: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.phanCongService.acceptJob(jobId, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // POST /techmate/cong-viec/:id/start - Bắt đầu làm (Mobile API)
    // ----------------------------------------
    @Post(':id/start')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: ' Bắt đầu làm việc (Mobile API)',
        description: 'Nhân viên bắt đầu thực hiện công việc',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Bắt đầu làm thành công' })
    async startJob(
        @Param('id', new ParseUUIDPipe()) jobId: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.phanCongService.startJob(jobId, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // POST /techmate/cong-viec/:id/complete-my-part - Hoàn thành (Mobile API)
    // ----------------------------------------
    @Post(':id/complete-my-part')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: ' Hoàn thành phần việc (Mobile API)',
        description: 'Nhân viên báo hoàn thành phần việc của mình',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Hoàn thành phần việc thành công' })
    async completeMyPart(
        @Param('id', new ParseUUIDPipe()) jobId: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.phanCongService.completeMyPart(jobId, user.id, user.id_doanh_nghiep);
    }

    // ============================================================
    // SECTION: EVIDENCE (Nghiệm thu hình ảnh)
    // ============================================================

    // ----------------------------------------
    // POST /techmate/cong-viec/:id/evidence - Thêm ảnh nghiệm thu
    // ----------------------------------------
    @Post(':id/evidence')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Thêm ảnh nghiệm thu',
        description: `
Thêm hình ảnh nghiệm thu vào công việc.

**Loại ảnh:**
- \`truoc\`: Trước khi làm
- \`sau\`: Sau khi hoàn thành
- \`qua_trinh\`: Trong quá trình thực hiện

**Lưu ý:** Chỉ nhận URL string (chưa tích hợp upload file)
        `,
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiBody({ type: AddEvidenceDto })
    @ApiResponse({ status: HttpStatus.CREATED, type: NghiemThuHinhAnhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy công việc' })
    async addEvidence(
        @Param('id', new ParseUUIDPipe()) jobId: string,
        @Body() dto: AddEvidenceDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.nghiemThuService.addEvidence(jobId, dto, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // POST /techmate/cong-viec/:id/evidence/bulk - Thêm nhiều ảnh
    // ----------------------------------------
    @Post(':id/evidence/bulk')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Thêm nhiều ảnh nghiệm thu',
        description: 'Upload nhiều ảnh cùng lúc (tối ưu cho Mobile)',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiBody({ type: BulkAddEvidenceDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        schema: {
            type: 'object',
            properties: {
                count: { type: 'number', example: 5 },
                message: { type: 'string', example: 'Đã thêm 5 ảnh nghiệm thu' },
            },
        },
    })
    async bulkAddEvidence(
        @Param('id', new ParseUUIDPipe()) jobId: string,
        @Body() dto: BulkAddEvidenceDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.nghiemThuService.bulkAddEvidence(jobId, dto.images, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // GET /techmate/cong-viec/:id/evidence - Danh sách ảnh
    // ----------------------------------------
    @Get(':id/evidence')
    @ApiOperation({
        summary: 'Danh sách ảnh nghiệm thu',
        description: 'Lấy danh sách hình ảnh nghiệm thu của công việc, nhóm theo loại ảnh',
    })
    @ApiParam({ name: 'id', description: 'UUID công việc' })
    @ApiQuery({ name: 'loai_anh', required: false, enum: ['truoc', 'sau', 'qua_trinh'] })
    @ApiResponse({ status: HttpStatus.OK, type: NghiemThuHinhAnhListResponseDto })
    async getEvidence(
        @Param('id', new ParseUUIDPipe()) jobId: string,
        @Query() query: QueryNghiemThuHinhAnhDto,
        @TenantId() tenantId: string,
    ) {
        return this.nghiemThuService.getByJob(jobId, tenantId, query);
    }
}

// ============================================================
// EVIDENCE CONTROLLER (Standalone for delete operation)
// ============================================================
@ApiTags('TechMate - Nghiệm Thu Hình Ảnh')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('techmate/evidence')
export class NghiemThuHinhAnhController {
    constructor(private readonly nghiemThuService: NghiemThuHinhAnhService) { }

    // ----------------------------------------
    // GET /techmate/evidence/:id - Chi tiết ảnh
    // ----------------------------------------
    @Get(':id')
    @ApiOperation({ summary: 'Chi tiết ảnh nghiệm thu' })
    @ApiParam({ name: 'id', description: 'UUID ảnh nghiệm thu' })
    @ApiResponse({ status: HttpStatus.OK, type: NghiemThuHinhAnhResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy hình ảnh' })
    async getOne(
        @Param('id', new ParseUUIDPipe()) id: string,
        @TenantId() tenantId: string,
    ) {
        return this.nghiemThuService.getOne(id, tenantId);
    }

    // ----------------------------------------
    // PATCH /techmate/evidence/:id - Cập nhật ảnh
    // ----------------------------------------
    @Patch(':id')
    @ApiOperation({ summary: 'Cập nhật thông tin ảnh nghiệm thu' })
    @ApiParam({ name: 'id', description: 'UUID ảnh nghiệm thu' })
    @ApiBody({ type: AddEvidenceDto })
    @ApiResponse({ status: HttpStatus.OK, type: NghiemThuHinhAnhResponseDto })
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() dto: Partial<AddEvidenceDto>,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.nghiemThuService.updateEvidence(id, dto, user.id, user.id_doanh_nghiep);
    }

    // ----------------------------------------
    // DELETE /techmate/evidence/:id - Xóa ảnh
    // ----------------------------------------
    @Delete(':id')
    @ApiOperation({
        summary: 'Xóa ảnh nghiệm thu',
        description: 'Xóa mềm hình ảnh nghiệm thu',
    })
    @ApiParam({ name: 'id', description: 'UUID ảnh nghiệm thu' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Xóa ảnh thành công' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy hình ảnh' })
    async delete(
        @Param('id', new ParseUUIDPipe()) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.nghiemThuService.deleteEvidence(id, user.id, user.id_doanh_nghiep);
    }
}
