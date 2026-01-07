/**
 * ============================================================
 * CUSTOMER AUTH GUARD - CustomerPortal Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Guard bảo vệ các route của cổng khách hàng.
 * Xác thực JWT và kiểm tra token thuộc về khách hàng (is_customer: true)
 * 
 * Token khách hàng có cấu trúc payload khác với token nhân viên:
 * - sub: TaiKhoanKhach.id (không phải NguoiDung.id)
 * - khach_hang_id: KhachHang.id
 * - is_customer: true
 */

import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';

// Interface ClsStore cho khách hàng
interface CustomerClsStore {
    customerId?: string;       // TaiKhoanKhach.id
    khachHangId?: string;      // KhachHang.id
    tenantId?: string;         // id_doanh_nghiep
    email?: string;
    isCustomer?: boolean;
    [key: string]: unknown;
    [key: symbol]: unknown;
}

// Key cho decorator @PublicCustomer()
export const IS_PUBLIC_CUSTOMER_KEY = 'isPublicCustomer';

@Injectable()
export class CustomerAuthGuard extends AuthGuard('customer-jwt') {
    constructor(
        private reflector: Reflector,
        private cls: ClsService<CustomerClsStore>,
    ) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Kiểm tra decorator @PublicCustomer()
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_CUSTOMER_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest<TUser = any>(
        err: any,
        user: TUser,
        info: any,
        context: ExecutionContext,
    ): TUser {
        if (err || !user) {
            throw err || new UnauthorizedException('Vui lòng đăng nhập để tiếp tục');
        }

        const userObj = user as any;

        // Xác minh đây là token khách hàng
        if (!userObj.is_customer) {
            throw new UnauthorizedException('Token không hợp lệ cho cổng khách hàng');
        }

        // Đặt thông tin khách hàng vào CLS context
        this.cls.set('customerId', userObj.id);
        this.cls.set('khachHangId', userObj.khach_hang_id);
        this.cls.set('tenantId', userObj.id_doanh_nghiep);
        this.cls.set('email', userObj.email);
        this.cls.set('isCustomer', true);

        return user;
    }
}
