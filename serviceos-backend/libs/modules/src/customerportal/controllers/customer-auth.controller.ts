/**
 * ============================================================
 * CUSTOMER AUTH CONTROLLER - CustomerPortal Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * API Endpoints cho Xác thực Khách hàng:
 * - POST /customer/auth/register - Đăng ký tài khoản khách hàng
 * - POST /customer/auth/login    - Đăng nhập và lấy JWT
 * - GET  /customer/auth/profile  - Lấy thông tin hồ sơ khách hàng hiện tại
 * 
 * LƯU Ý: Đăng ký yêu cầu tenantId vì tạo tài khoản liên kết đến
 * một doanh nghiệp cụ thể. Trong thực tế, endpoint này được gọi
 * từ URL cổng riêng của từng tenant.
 */

import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
    Headers,
    BadRequestException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiHeader,
    ApiExtraModels,
} from '@nestjs/swagger';
import { CustomerAuthService } from '../services/customer-auth.service';
import { CustomerAuthGuard } from '../guards/customer-auth.guard';
import {
    CustomerRegisterDto,
    CustomerLoginDto,
    CustomerAuthResponseDto,
    CustomerProfileResponseDto,
} from '../dto/customer-auth.dto';
import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';

// ============================================================
// DECORATORS
// ============================================================

/**
 * Đánh dấu route là public (không yêu cầu auth cho cổng khách hàng)
 */
export const IS_PUBLIC_CUSTOMER_KEY = 'isPublicCustomer';
export const PublicCustomer = () => SetMetadata(IS_PUBLIC_CUSTOMER_KEY, true);

/**
 * Lấy thông tin khách hàng đang đăng nhập từ request
 */
export interface ActiveCustomerData {
    id: string;              // TaiKhoanKhach.id
    email: string;
    id_doanh_nghiep: string; // tenantId
    khach_hang_id: string;   // KhachHang.id
    is_customer: boolean;
}

export const ActiveCustomer = createParamDecorator(
    (field: keyof ActiveCustomerData | undefined, ctx: ExecutionContext): any => {
        const request = ctx.switchToHttp().getRequest();
        const customer = request.user as ActiveCustomerData;

        if (!customer) {
            return null;
        }

        return field ? customer[field] : customer;
    },
);

// ============================================================
// CONTROLLER
// ============================================================

@ApiTags('CustomerPortal - Xác thực')
@Controller('customer/auth')
@ApiExtraModels(CustomerAuthResponseDto, CustomerProfileResponseDto)
export class CustomerAuthController {
    constructor(private readonly customerAuthService: CustomerAuthService) { }

    // ----------------------------------------
    // POST /customer/auth/register - Đăng ký
    // ----------------------------------------
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Đăng ký tài khoản khách hàng',
        description: `
Đăng ký tài khoản cổng khách hàng.

**Yêu cầu:**
- Header \`x-tenant-id\` bắt buộc (UUID của doanh nghiệp)
- \`khach_hang_id\` phải là UUID của khách hàng đã tồn tại trong CRM
- Email chưa được đăng ký

**Lưu ý:** Trong thực tế, endpoint này thường được gọi từ landing page của từng doanh nghiệp.
        `,
    })
    @ApiHeader({
        name: 'x-tenant-id',
        description: 'ID doanh nghiệp (UUID)',
        required: true,
    })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Đăng ký thành công' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email đã được đăng ký / Khách hàng đã có tài khoản' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Không tìm thấy khách hàng' })
    async register(
        @Body() dto: CustomerRegisterDto,
        @Headers('x-tenant-id') tenantId: string,
    ) {
        if (!tenantId) {
            throw new BadRequestException('Thiếu header x-tenant-id');
        }
        return this.customerAuthService.register(dto, tenantId);
    }

    // ----------------------------------------
    // POST /customer/auth/login - Đăng nhập
    // ----------------------------------------
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Đăng nhập cổng khách hàng',
        description: `
Đăng nhập và nhận JWT token.

**Token:**
- Access token hết hạn sau 15 phút
- Refresh token hết hạn sau 7 ngày
- Token chứa \`is_customer: true\` để phân biệt với token nhân viên
        `,
    })
    @ApiResponse({ status: HttpStatus.OK, type: CustomerAuthResponseDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Email hoặc mật khẩu không đúng' })
    async login(@Body() dto: CustomerLoginDto) {
        return this.customerAuthService.login(dto);
    }

    // ----------------------------------------
    // GET /customer/auth/profile - Lấy thông tin hồ sơ
    // ----------------------------------------
    @Get('profile')
    @UseGuards(CustomerAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Lấy thông tin tài khoản',
        description: 'Lấy thông tin chi tiết tài khoản và khách hàng liên kết',
    })
    @ApiResponse({ status: HttpStatus.OK, type: CustomerProfileResponseDto })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Chưa đăng nhập' })
    async getProfile(@ActiveCustomer() customer: ActiveCustomerData) {
        return this.customerAuthService.getProfile(customer.id);
    }
}
