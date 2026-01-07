/**
 * ============================================================
 * ĐƠN ĐẶT HÀNG NCC CONTROLLER - ProcurePool Module
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * REST API for Purchase Order Management (DonDatHangNcc)
 * Phase 10: ProcurePool - Procurement Management
 *
 * KEY ENDPOINTS:
 * - POST /procure-pool/orders - Tạo đơn đặt hàng (PO)
 * - POST /procure-pool/orders/:id/confirm - Xác nhận đặt hàng
 * - POST /procure-pool/orders/:id/receive -  Nhận hàng (Integration với StockPile)
 * - POST /procure-pool/orders/:id/cancel - Hủy đơn
 */

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard, ActiveUser, ActiveUserData } from '@libs/common';
import { DonDatHangService } from '../services/don-dat-hang.service';
import {
    CreateDonDatHangDto,
    UpdateDonDatHangDto,
    ConfirmOrderDto,
    ReceiveGoodsDto,
    CancelOrderDto,
    QueryDonDatHangDto,
    DonDatHangResponseDto,
    DonDatHangListResponseDto,
    DonDatHangStatsDto,
} from '../dto/don-dat-hang.dto';

@ApiTags('ProcurePool - Đơn đặt hàng NCC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('procure-pool/orders')
export class DonDatHangController {
    constructor(private readonly donDatHangService: DonDatHangService) { }

    // ============================================================
    // CREATE
    // ============================================================

    @Post()
    @ApiOperation({
        summary: 'Tạo đơn đặt hàng (Purchase Order)',
        description: `
Tạo đơn đặt hàng NCC với danh sách sản phẩm.
- Trạng thái mặc định: DRAFT (Nháp)
- Có thể tạo với trạng thái ORDERED nếu muốn bỏ qua bước xác nhận
- Tự động tính tổng tiền từ items
        `,
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Tạo đơn đặt hàng thành công',
        type: DonDatHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Dữ liệu không hợp lệ',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy NCC hoặc sản phẩm',
    })
    async create(
        @ActiveUser() user: ActiveUserData,
        @Body() dto: CreateDonDatHangDto,
    ) {
        return this.donDatHangService.createPO(user.id_doanh_nghiep, dto, user.id);
    }

    // ============================================================
    // READ
    // ============================================================

    @Get()
    @ApiOperation({
        summary: 'Danh sách đơn đặt hàng',
        description: 'Lấy danh sách đơn đặt hàng với filter và phân trang',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lấy danh sách thành công',
        type: DonDatHangListResponseDto,
    })
    async findAll(
        @ActiveUser() user: ActiveUserData,
        @Query() query: QueryDonDatHangDto,
    ) {
        return this.donDatHangService.findAll(user.id_doanh_nghiep, query);
    }

    @Get('stats')
    @ApiOperation({
        summary: 'Thống kê đơn đặt hàng',
        description: 'Lấy thống kê số lượng đơn theo trạng thái và tổng giá trị',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Thống kê thành công',
        type: DonDatHangStatsDto,
    })
    async getStats(@ActiveUser() user: ActiveUserData) {
        return this.donDatHangService.getStats(user.id_doanh_nghiep);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Chi tiết đơn đặt hàng',
        description: 'Lấy thông tin chi tiết đơn đặt hàng theo ID',
    })
    @ApiParam({ name: 'id', description: 'ID đơn đặt hàng (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Lấy thông tin thành công',
        type: DonDatHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy đơn đặt hàng',
    })
    async findOne(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.donDatHangService.findOne(user.id_doanh_nghiep, id);
    }

    // ============================================================
    // UPDATE
    // ============================================================

    @Put(':id')
    @ApiOperation({
        summary: 'Cập nhật đơn đặt hàng',
        description: 'Cập nhật đơn đặt hàng (chỉ cho trạng thái DRAFT)',
    })
    @ApiParam({ name: 'id', description: 'ID đơn đặt hàng (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Cập nhật thành công',
        type: DonDatHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy đơn đặt hàng',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Chỉ được cập nhật đơn DRAFT',
    })
    async update(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateDonDatHangDto,
    ) {
        return this.donDatHangService.update(
            user.id_doanh_nghiep,
            id,
            dto,
            user.id,
        );
    }

    // ============================================================
    // WORKFLOW ACTIONS
    // ============================================================

    @Post(':id/confirm')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Xác nhận đơn đặt hàng',
        description: 'Chuyển trạng thái từ DRAFT sang ORDERED',
    })
    @ApiParam({ name: 'id', description: 'ID đơn đặt hàng (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Xác nhận thành công',
        type: DonDatHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy đơn đặt hàng',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Chỉ được xác nhận đơn DRAFT',
    })
    async confirmOrder(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ConfirmOrderDto,
    ) {
        return this.donDatHangService.confirmOrder(
            user.id_doanh_nghiep,
            id,
            dto,
            user.id,
        );
    }

    @Post(':id/receive')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: ' Nhận hàng (Goods Receipt)',
        description: `
**KEY INTEGRATION với StockPile Module**

Khi nhận hàng:
1. Validate đơn phải ở trạng thái ORDERED
2. Gọi TonKhoService.nhapKho để tăng tồn kho
3. Cập nhật trạng thái đơn -> RECEIVED
4. Ghi nhận ngay_giao_thuc_te = now()

**Nguồn nhập kho**: \`PO-{ma_don_hang}\`
        `,
    })
    @ApiParam({ name: 'id', description: 'ID đơn đặt hàng (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Nhận hàng thành công',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Nhận hàng thành công' },
                don_dat_hang: { $ref: '#/components/schemas/DonDatHangResponseDto' },
                phieu_nhap_kho: {
                    type: 'object',
                    properties: {
                        ma_phieu: { type: 'string', example: 'NK-1704585600000' },
                        loai_phieu: { type: 'string', example: 'nhap' },
                        so_items: { type: 'number', example: 3 },
                        tong_so_luong: { type: 'number', example: 50 },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy đơn đặt hàng hoặc kho',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Chỉ được nhận hàng cho đơn ORDERED',
    })
    async receiveGoods(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ReceiveGoodsDto,
    ) {
        return this.donDatHangService.receiveGoods(
            user.id_doanh_nghiep,
            id,
            dto,
            user.id,
        );
    }

    @Post(':id/cancel')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Hủy đơn đặt hàng',
        description: 'Hủy đơn đặt hàng (chỉ cho DRAFT hoặc ORDERED)',
    })
    @ApiParam({ name: 'id', description: 'ID đơn đặt hàng (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Hủy đơn thành công',
        type: DonDatHangResponseDto,
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy đơn đặt hàng',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Không thể hủy đơn đã nhận hàng',
    })
    async cancelOrder(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: CancelOrderDto,
    ) {
        return this.donDatHangService.cancelOrder(
            user.id_doanh_nghiep,
            id,
            dto,
            user.id,
        );
    }

    // ============================================================
    // DELETE (SOFT)
    // ============================================================

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Xóa đơn đặt hàng (soft delete)',
        description: 'Xóa mềm đơn đặt hàng (chỉ cho DRAFT hoặc CANCELLED)',
    })
    @ApiParam({ name: 'id', description: 'ID đơn đặt hàng (UUID)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Xóa thành công',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Không tìm thấy đơn đặt hàng',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Không thể xóa đơn đang xử lý hoặc đã nhận hàng',
    })
    async remove(
        @ActiveUser() user: ActiveUserData,
        @Param('id', ParseUUIDPipe) id: string,
    ) {
        return this.donDatHangService.remove(user.id_doanh_nghiep, id, user.id);
    }
}
