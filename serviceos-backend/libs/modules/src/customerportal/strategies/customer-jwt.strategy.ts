/**
 * ============================================================
 * CUSTOMER JWT STRATEGY - CustomerPortal Module
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Passport strategy để xác thực JWT khách hàng
 * Sử dụng cùng secret nhưng kiểm tra cờ is_customer trong payload
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CustomerJwtPayload } from '../services/customer-auth.service';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'serviceos-secret-key',
        });
    }

    async validate(payload: CustomerJwtPayload) {
        // Kiểm tra các trường bắt buộc
        if (!payload.sub || !payload.tenantId) {
            throw new UnauthorizedException('Token không hợp lệ');
        }

        // Kiểm tra đây là token khách hàng
        if (!payload.is_customer) {
            throw new UnauthorizedException('Token không phải của khách hàng');
        }

        // Trả về user object - được gắn vào request.user
        return {
            id: payload.sub,
            email: payload.email,
            id_doanh_nghiep: payload.tenantId,
            khach_hang_id: payload.khach_hang_id,
            is_customer: true,
        };
    }
}
