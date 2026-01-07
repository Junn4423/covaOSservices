/**
 * ============================================================
 * BILLING CONTROLLER - Quản lý Gói cước SaaS
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Phase 14: Quản lý Gói cước SaaS
 *
 * ENDPOINTS:
 * GET    /billing/subscription          - Thông tin gói cước hiện tại
 * POST   /billing/subscription/upgrade  - Nâng cấp gói cước
 * POST   /billing/subscription/cancel   - Hủy tự động gia hạn
 * GET    /billing/history               - Lịch sử thanh toán
 * GET    /billing/pricing               - Bảng giá gói cước
 *
 * ADMIN ENDPOINTS:
 * POST   /billing/admin/manual-payment  - Tạo thanh toán thủ công
 * POST   /billing/admin/check-expired   - Kiểm tra và khóa tenant hết hạn
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
    ApiBody,
} from '@nestjs/swagger';
import { BillingService } from '../services/billing.service';
import {
    UpgradeSubscriptionDto,
    CancelSubscriptionDto,
    ManualPaymentDto,
    QueryBillingHistoryDto,
} from '../dto/billing.dto';
import { JwtAuthGuard, RolesGuard, Roles, TenantId, UserId } from '@libs/common';

@ApiTags('Billing - Quản lý Gói cước')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) {}

    // ============================================================
    // SUBSCRIPTION ENDPOINTS
    // ============================================================

    @Get('subscription')
    @ApiOperation({
        summary: 'Lấy thông tin gói cước hiện tại',
        description: 'Trả về thông tin gói cước, trạng thái, ngày hết hạn và số ngày còn lại của doanh nghiệp.',
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy thông tin gói cước thành công',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy doanh nghiệp',
    })
    getCurrentSubscription(@TenantId() tenantId: string) {
        return this.billingService.getCurrentSubscription(tenantId);
    }

    @Post('subscription/upgrade')
    @Roles('admin', 'manager')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Nâng cấp gói cước',
        description:
            'Nâng cấp gói cước lên gói mới (TRIAL, BASIC, PRO, ENTERPRISE). ' +
            'Hiện tại mô phỏng thanh toán thành công (chưa tích hợp Stripe).',
    })
    @ApiBody({ type: UpgradeSubscriptionDto })
    @ApiResponse({
        status: 200,
        description: 'Đã nâng cấp gói cước thành công',
    })
    @ApiResponse({
        status: 400,
        description: 'Yêu cầu không hợp lệ hoặc thanh toán thất bại',
    })
    upgradeSubscription(
        @TenantId() tenantId: string,
        @UserId() userId: string,
        @Body() dto: UpgradeSubscriptionDto,
    ) {
        return this.billingService.upgradeSubscription(tenantId, dto, userId);
    }

    @Post('subscription/cancel')
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Hủy tự động gia hạn gói cước',
        description:
            'Hủy tự động gia hạn. Gói cước hiện tại vẫn còn hiệu lực đến ngày hết hạn. ' +
            'Sau ngày hết hạn, tài khoản sẽ bị khóa.',
    })
    @ApiBody({ type: CancelSubscriptionDto })
    @ApiResponse({
        status: 200,
        description: 'Đã ghi nhận yêu cầu hủy gói cước',
    })
    cancelSubscription(
        @TenantId() tenantId: string,
        @UserId() userId: string,
        @Body() dto: CancelSubscriptionDto,
    ) {
        return this.billingService.cancelSubscription(tenantId, dto, userId);
    }

    // ============================================================
    // BILLING HISTORY ENDPOINTS
    // ============================================================

    @Get('history')
    @ApiOperation({
        summary: 'Lịch sử thanh toán',
        description:
            'Lấy danh sách các giao dịch thanh toán của doanh nghiệp. ' +
            'Hỗ trợ lọc theo ngày, trạng thái và phân trang.',
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy lịch sử thanh toán thành công',
    })
    getBillingHistory(
        @TenantId() tenantId: string,
        @Query() query: QueryBillingHistoryDto,
    ) {
        return this.billingService.getBillingHistory(tenantId, query);
    }

    // ============================================================
    // PRICING ENDPOINT
    // ============================================================

    @Get('pricing')
    @ApiOperation({
        summary: 'Bảng giá gói cước',
        description: 'Lấy bảng giá các gói cước ServiceOS.',
    })
    @ApiResponse({
        status: 200,
        description: 'Lấy bảng giá thành công',
    })
    getPricing() {
        return this.billingService.getPricing();
    }

    // ============================================================
    // ADMIN ENDPOINTS
    // ============================================================

    @Post('admin/manual-payment')
    @Roles('admin')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: '[Admin] Tạo thanh toán thủ công',
        description:
            'Tạo bản ghi thanh toán thủ công cho trường hợp B2B chuyển khoản ngân hàng. ' +
            'Tự động gia hạn gói cước cho doanh nghiệp được chỉ định. ' +
            'Chỉ dành cho Admin hệ thống.',
    })
    @ApiBody({ type: ManualPaymentDto })
    @ApiResponse({
        status: 201,
        description: 'Đã tạo thanh toán thủ công thành công',
    })
    @ApiResponse({
        status: 404,
        description: 'Không tìm thấy doanh nghiệp',
    })
    createManualPayment(@UserId() userId: string, @Body() dto: ManualPaymentDto) {
        return this.billingService.createManualPayment(dto, userId);
    }

    @Post('admin/check-expired')
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: '[Admin] Kiểm tra và khóa tenant hết hạn',
        description:
            'Kiểm tra tất cả các doanh nghiệp có gói cước hết hạn và khóa tài khoản. ' +
            'Phương thức này nên được gọi bởi Cron Job hàng ngày hoặc thủ công bởi Admin.',
    })
    @ApiResponse({
        status: 200,
        description: 'Kiểm tra và khóa tenant hết hạn thành công',
    })
    checkAndLockExpiredTenants() {
        return this.billingService.checkAndLockExpiredTenants();
    }
}
