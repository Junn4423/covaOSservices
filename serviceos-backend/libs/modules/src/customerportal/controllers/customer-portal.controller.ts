/**
 * ============================================================
 * CUSTOMER PORTAL CONTROLLER - CustomerPortal Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * API Endpoints cho Tính năng Cổng Khách hàng:
 * - GET  /customer/portal/profile  - Lấy thông tin khách hàng
 * - GET  /customer/portal/jobs     - Danh sách công việc của tôi
 * - GET  /customer/portal/quotes   - Danh sách báo giá của tôi
 * - POST /customer/portal/reviews  - Gửi đánh giá
 * - GET  /customer/portal/reviews  - Danh sách đánh giá của tôi
 */

import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiExtraModels,
} from '@nestjs/swagger';
import { CustomerPortalService } from '../services/customer-portal.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import {
    ActiveCustomer,
    ActiveCustomerData,
} from './customer-auth.controller';
import {
    QueryCustomerJobsDto,
    QueryCustomerQuotesDto,
    CreateReviewDto,
    CustomerJobResponseDto,
    CustomerQuoteResponseDto,
    ReviewResponseDto,
} from '../dto/customer-portal.dto';

@ApiTags('CustomerPortal - Cổng khách hàng')
@ApiBearerAuth()
@UseGuards(CustomerAuthGuard)
@Controller('customer/portal')
@ApiExtraModels(CustomerJobResponseDto, CustomerQuoteResponseDto, ReviewResponseDto)
export class CustomerPortalController {
    constructor(private readonly portalService: CustomerPortalService) { }

    // ----------------------------------------
    // GET /customer/portal/profile - Lấy thông tin khách hàng
    // ----------------------------------------
    @Get('profile')
    @ApiOperation({
        summary: 'Thông tin khách hàng',
        description: 'Lấy thông tin chi tiết khách hàng từ bảng KhachHang',
    })
    @ApiResponse({ status: HttpStatus.OK, description: 'Thông tin khách hàng' })
    async getProfile(@ActiveCustomer() customer: ActiveCustomerData) {
        return this.portalService.getProfile(
            customer.khach_hang_id,
            customer.id_doanh_nghiep,
        );
    }

    // ----------------------------------------
    // GET /customer/portal/jobs - Danh sách công việc của tôi
    // ----------------------------------------
    @Get('jobs')
    @ApiOperation({
        summary: 'Danh sách công việc của tôi',
        description: `
Lấy danh sách công việc thuộc về khách hàng đang đăng nhập.

**Bao gồm:**
- Trạng thái công việc (0=Mới, 1=Đang thực hiện, 2=Hoàn thành, 3=Hủy)
- Ngày hẹn, ngày hoàn thành
- Thông tin kỹ thuật viên được phân công
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách công việc',
        schema: {
            type: 'object',
            properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/CustomerJobResponseDto' } },
                meta: {
                    type: 'object',
                    properties: {
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        total: { type: 'number' },
                        totalPages: { type: 'number' },
                    },
                },
            },
        },
    })
    async getMyJobs(
        @Query() query: QueryCustomerJobsDto,
        @ActiveCustomer() customer: ActiveCustomerData,
    ) {
        return this.portalService.getMyJobs(
            customer.khach_hang_id,
            customer.id_doanh_nghiep,
            query,
        );
    }

    // ----------------------------------------
    // GET /customer/portal/quotes - Danh sách báo giá của tôi
    // ----------------------------------------
    @Get('quotes')
    @ApiOperation({
        summary: 'Danh sách báo giá của tôi',
        description: `
Lấy danh sách báo giá thuộc về khách hàng đang đăng nhập.

**Trạng thái báo giá:** DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
        `,
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách báo giá',
        schema: {
            type: 'object',
            properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/CustomerQuoteResponseDto' } },
                meta: {
                    type: 'object',
                    properties: {
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        total: { type: 'number' },
                        totalPages: { type: 'number' },
                    },
                },
            },
        },
    })
    async getMyQuotes(
        @Query() query: QueryCustomerQuotesDto,
        @ActiveCustomer() customer: ActiveCustomerData,
    ) {
        return this.portalService.getMyQuotes(
            customer.khach_hang_id,
            customer.id_doanh_nghiep,
            query,
        );
    }

    // ----------------------------------------
    // POST /customer/portal/reviews - Gửi đánh giá
    // ----------------------------------------
    @Post('reviews')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Gửi đánh giá',
        description: `
Gửi đánh giá cho công việc đã hoàn thành.

**Validation:**
- Công việc phải thuộc về khách hàng đang đăng nhập
- Công việc phải ở trạng thái HOÀN THÀNH (2)
- Mỗi công việc chỉ được đánh giá 1 lần

**so_sao:** Từ 1 đến 5
        `,
    })
    @ApiResponse({ status: HttpStatus.CREATED, type: ReviewResponseDto })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy công việc' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Công việc chưa hoàn thành' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Đã đánh giá công việc này' })
    async createReview(
        @Body() dto: CreateReviewDto,
        @ActiveCustomer() customer: ActiveCustomerData,
    ) {
        return this.portalService.createReview(
            dto,
            customer.khach_hang_id,
            customer.id_doanh_nghiep,
            customer.id,
        );
    }

    // ----------------------------------------
    // GET /customer/portal/reviews - Danh sách đánh giá của tôi
    // ----------------------------------------
    @Get('reviews')
    @ApiOperation({
        summary: 'Danh sách đánh giá của tôi',
        description: 'Lấy tất cả đánh giá mà khách hàng đã gửi',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Danh sách đánh giá',
        schema: {
            type: 'object',
            properties: {
                data: { type: 'array', items: { $ref: '#/components/schemas/ReviewResponseDto' } },
            },
        },
    })
    async getMyReviews(@ActiveCustomer() customer: ActiveCustomerData) {
        return this.portalService.getMyReviews(
            customer.khach_hang_id,
            customer.id_doanh_nghiep,
        );
    }
}
