/**
 * ============================================================
 * JWT Auth Guard - Authentication Guard
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Guard này kết hợp:
 * 1. Passport JWT validation
 * 2. Set CLS context cho multi-tenant filtering
 *
 * FLOW:
 * 1. Request đến → ClsMiddleware tạo CLS context (đã setup ở AppModule)
 * 2. JwtAuthGuard validate token → Passport attach user vào request
 * 3. JwtAuthGuard set user info vào CLS context
 * 4. PrismaService đọc từ CLS context để filter theo tenant
 */

import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { IS_PUBLIC_KEY } from '../decorators';

// Import ClsStore interface từ PrismaService
interface ClsStore {
    userId?: string;
    tenantId?: string;
    email?: string;
    hoTen?: string;
    vaiTro?: string;
    bypassTenantFilter?: boolean;
    [key: string]: unknown;
    [key: symbol]: unknown;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(
        private reflector: Reflector,
        private cls: ClsService<ClsStore>,
    ) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Check for @Public() decorator
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    /**
     * Handle request sau khi Passport validate xong
     * Set user info vào CLS context cho PrismaService sử dụng
     */
    handleRequest<TUser = any>(
        err: any,
        user: TUser,
        info: any,
        context: ExecutionContext,
    ): TUser {
        if (err || !user) {
            throw err || new UnauthorizedException('Vui lòng đăng nhập để tiếp tục');
        }

        // Set user info vào CLS context
        // PrismaService sẽ đọc từ đây để inject tenant filter
        const userObj = user as any;
        this.cls.set('userId', userObj.id);
        this.cls.set('tenantId', userObj.id_doanh_nghiep);
        this.cls.set('email', userObj.email);
        this.cls.set('hoTen', userObj.ho_ten);
        this.cls.set('vaiTro', userObj.vai_tro);

        return user;
    }
}
