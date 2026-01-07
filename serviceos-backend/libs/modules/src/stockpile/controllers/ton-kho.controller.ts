/**
 * ============================================================
 * TỒN KHO CONTROLLER - StockPile Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * 📌 INVENTORY MANAGEMENT API:
 * - Nhập kho (Import Stock)
 * - Xuất kho (Export Stock)
 * - Chuyển kho (Transfer Stock)
 * - Xem tồn kho (Inventory List)
 * - Thẻ kho (Stock Card / Audit Trail)
 *
 * 📌 INTEGRATION:
 * API xuatKho được thiết kế để TechMate có thể gọi
 * khi nhân viên báo cáo sử dụng vật tư cho công việc.
 *
 * Phase 9: StockPile Advanced - Warehouse & Inventory
 */

import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    HttpCode,
    HttpStatus,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { TonKhoService } from '../services/ton-kho.service';
import {
    NhapKhoDto,
    XuatKhoDto,
    ChuyenKhoDto,
    QueryTonKhoDto,
    QueryTheKhoDto,
    PhieuKhoResponseDto,
    TonKhoListResponseDto,
    LichSuKhoResponseDto,
} from '../dto/ton-kho.dto';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';

@ApiTags('StockPile - Tồn Kho (Inventory)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ton-kho')
export class TonKhoController {
    constructor(private readonly tonKhoService: TonKhoService) { }

    // ============================================================
    //  POST /ton-kho/nhap - Nhập kho
    // ============================================================
    @Post('nhap')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Nhập kho',
        description: `
Nhập vật tư vào kho. Mỗi item cần có:
- san_pham_id: ID sản phẩm
- so_luong: Số lượng nhập (> 0)
- don_gia: Đơn giá nhập (>= 0, optional)

**Logic:**
1. Tạo các bản ghi LichSuKho với loai_phieu = NHAP
2. Nếu TonKho chưa có -> Tạo mới
3. Nếu TonKho đã có -> Tăng số lượng
        `,
    })
    @ApiBody({ type: NhapKhoDto })
    @ApiResponse({
        status: 201,
        description: 'Phiếu nhập kho',
        type: PhieuKhoResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy kho hoặc sản phẩm' })
    async nhapKho(
        @Body() dto: NhapKhoDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.tonKhoService.nhapKho(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    //  POST /ton-kho/xuat - Xuất kho
    // ============================================================
    @Post('xuat')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Xuất kho',
        description: `
Xuất vật tư từ kho (sử dụng cho công việc hoặc mục đích khác).

**Input:**
- kho_id: ID kho xuất
- cong_viec_id: ID công việc (optional - dùng khi xuất cho công việc)
- items: Danh sách sản phẩm xuất

**Logic:**
1. Validate tồn kho đủ không? (Nếu thiếu -> Throw Error với chi tiết)
2. Tạo bản ghi LichSuKho với loai_phieu = XUAT
3. Giảm số lượng trong TonKho

**Integration:**
API này được thiết kế để module TechMate có thể gọi khi nhân viên
báo cáo sử dụng vật tư cho công việc.
        `,
    })
    @ApiBody({ type: XuatKhoDto })
    @ApiResponse({
        status: 201,
        description: 'Phiếu xuất kho',
        type: PhieuKhoResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Không đủ tồn kho',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Không đủ tồn kho để xuất' },
                errors: {
                    type: 'array',
                    items: { type: 'string' },
                    example: [
                        '"Bộ vệ sinh máy lạnh": Yêu cầu 10, chỉ có 5 (tồn: 5, đặt trước: 0)',
                    ],
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy kho hoặc công việc' })
    async xuatKho(
        @Body() dto: XuatKhoDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.tonKhoService.xuatKho(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    //  POST /ton-kho/chuyen - Chuyển kho
    // ============================================================
    @Post('chuyen')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Chuyển kho',
        description: `
Di chuyển vật tư từ kho này sang kho khác.

**Input:**
- tu_kho_id: ID kho nguồn (xuất)
- den_kho_id: ID kho đích (nhập)
- items: Danh sách sản phẩm chuyển

**Logic:**
1. Validate kho nguồn và kho đích tồn tại, không trùng nhau
2. Validate tồn kho đủ ở kho nguồn
3. Tạo bản ghi LichSuKho với loai_phieu = CHUYEN
4. Giảm tồn kho nguồn, tăng tồn kho đích
        `,
    })
    @ApiBody({ type: ChuyenKhoDto })
    @ApiResponse({
        status: 201,
        description: 'Phiếu chuyển kho',
        type: PhieuKhoResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Không đủ tồn kho hoặc kho trùng nhau',
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy kho' })
    async chuyenKho(
        @Body() dto: ChuyenKhoDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.tonKhoService.chuyenKho(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    //  GET /ton-kho - Danh sách tồn kho
    // ============================================================
    @Get()
    @ApiOperation({
        summary: 'Lấy danh sách tồn kho theo kho',
        description: `
Lấy danh sách tồn kho của một kho cụ thể.

**Filter:**
- kho_id: ID kho (bắt buộc)
- search: Tìm theo tên/mã sản phẩm
- sap_het_hang: Chỉ lấy SP có số lượng <= mức cảnh báo (10)
        `,
    })
    @ApiResponse({
        status: 200,
        description: 'Danh sách tồn kho',
        type: TonKhoListResponseDto,
    })
    async getTonKho(
        @Query() query: QueryTonKhoDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.tonKhoService.getTonKho(user.id_doanh_nghiep, query);
    }

    // ============================================================
    //  GET /ton-kho/the-kho - Thẻ kho (Stock Card)
    // ============================================================
    @Get('the-kho')
    @ApiOperation({
        summary: 'Xem thẻ kho (Stock Card)',
        description: `
Xem lịch sử biến động của một sản phẩm cụ thể trong một kho.

**Filter:**
- kho_id: ID kho (bắt buộc)
- san_pham_id: ID sản phẩm (bắt buộc)
- tu_ngay/den_ngay: Khoảng thời gian
- loai_phieu: Lọc theo loại (NHAP, XUAT, CHUYEN, KIEM_KE)
        `,
    })
    @ApiResponse({
        status: 200,
        description: 'Thẻ kho với lịch sử biến động',
        schema: {
            type: 'object',
            properties: {
                san_pham: { type: 'object' },
                ton_kho_hien_tai: { type: 'number', example: 50 },
                data: { type: 'array', items: { $ref: '#/components/schemas/LichSuKhoResponseDto' } },
                meta: { type: 'object' },
            },
        },
    })
    async getTheKho(
        @Query() query: QueryTheKhoDto,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.tonKhoService.getTheKho(user.id_doanh_nghiep, query);
    }

    // ============================================================
    //  GET /ton-kho/stats - Thống kê tồn kho
    // ============================================================
    @Get('stats')
    @ApiOperation({
        summary: 'Thống kê tồn kho',
        description: `
Thống kê tổng quan về tồn kho.

**Response:**
- tong_san_pham: Tổng số sản phẩm có trong kho
- tong_so_luong: Tổng số lượng tồn
- sap_het_hang: Số sản phẩm sắp hết (< mức cảnh báo)
- so_kho: Số lượng kho
        `,
    })
    @ApiResponse({
        status: 200,
        description: 'Thống kê tồn kho',
        schema: {
            type: 'object',
            properties: {
                tong_san_pham: { type: 'number', example: 100 },
                tong_so_luong: { type: 'number', example: 5000 },
                sap_het_hang: { type: 'number', example: 5 },
                so_kho: { type: 'number', example: 3 },
                muc_canh_bao: { type: 'number', example: 10 },
            },
        },
    })
    async getStats(
        @Query('kho_id') khoId: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.tonKhoService.getStats(user.id_doanh_nghiep, khoId);
    }

    // ============================================================
    //  GET /ton-kho/san-pham/:id - Tồn kho theo sản phẩm
    // ============================================================
    @Get('san-pham/:id')
    @ApiOperation({
        summary: 'Lấy tồn kho của sản phẩm ở tất cả các kho',
        description: 'Xem tổng quan tồn kho của 1 sản phẩm ở các kho khác nhau',
    })
    @ApiParam({ name: 'id', description: 'ID sản phẩm (UUID)' })
    @ApiResponse({
        status: 200,
        description: 'Tồn kho theo sản phẩm',
        schema: {
            type: 'object',
            properties: {
                san_pham: { type: 'object' },
                tong_ton_kho: { type: 'number', example: 100 },
                chi_tiet: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            kho: { type: 'object' },
                            so_luong: { type: 'number' },
                            so_luong_dat_truoc: { type: 'number' },
                            so_luong_kha_dung: { type: 'number' },
                        },
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
    async getTonKhoBySanPham(
        @Param('id', ParseUUIDPipe) id: string,
        @ActiveUser() user: ActiveUserData,
    ) {
        return this.tonKhoService.getTonKhoBySanPham(user.id_doanh_nghiep, id);
    }
}
