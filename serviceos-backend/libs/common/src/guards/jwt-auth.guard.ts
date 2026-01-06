/**
 * ============================================================
 * JWT Authentication Guard
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Guard này:
 * 1. Verify JWT token
 * 2. Attach user vào request.user
 * 3. PrismaService sẽ đọc request.user để lấy tenant ID
 */

import {
    Injectable,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Check if route is marked as @Public()
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) {
            throw err || new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
        }

        // User đã được attach vào request bởi Passport
        // PrismaService (Scope.REQUEST) sẽ đọc request.user
        // để lấy id_doanh_nghiep cho multi-tenant filtering

        return user;
    }
}
