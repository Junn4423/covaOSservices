/**
 * ============================================================
 * Custom Decorators
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

// ============================================================
// @ActiveUser() - Extract current user from request
// ============================================================
export interface ActiveUserData {
    id: string;
    email: string;
    ho_ten: string;
    vai_tro: string;
    id_doanh_nghiep: string;
    doanh_nghiep: {
        id: string;
        ten_doanh_nghiep: string;
        goi_cuoc: string;
        trang_thai: number;
    };
}

export const ActiveUser = createParamDecorator(
    (field: keyof ActiveUserData | undefined, ctx: ExecutionContext): any => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user as ActiveUserData;

        if (!user) {
            return null;
        }

        return field ? user[field] : user;
    },
);

// ============================================================
// @TenantId() - Quick access to current tenant ID
// ============================================================
export const TenantId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        return request.user?.id_doanh_nghiep;
    },
);

// ============================================================
// @UserId() - Quick access to current user ID
// ============================================================
export const UserId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        return request.user?.id;
    },
);

// ============================================================
// @Public() - Mark route as public (no auth required)
// ============================================================
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ============================================================
// @Roles() - Role-based access control
// ============================================================
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
