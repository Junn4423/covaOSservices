/**
 * ============================================================
 * Roles Guard - Role-based Access Control
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('Không có quyền truy cập');
        }

        const hasRole = requiredRoles.includes(user.vai_tro);

        if (!hasRole) {
            throw new ForbiddenException(
                `Chức năng này yêu cầu quyền: ${requiredRoles.join(' hoặc ')}`,
            );
        }

        return true;
    }
}
