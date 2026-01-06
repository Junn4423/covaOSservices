/**
 * ============================================================
 * JWT Strategy - Passport Configuration
 * ServiceOS - SaaS Backend
 * ============================================================
 * 
 * Validate JWT token và trả về user object
 * User object sẽ được attach vào request.user
 * PrismaService (Scope.REQUEST) sẽ đọc từ đó
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
    sub: string;           // User ID
    email: string;
    tenantId: string;      // id_doanh_nghiep
    role: string;          // vai_tro
    ho_ten?: string;
    iat?: number;
    exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'serviceos-secret-key',
        });
    }

    /**
     * Validate JWT payload và trả về user object
     * Object này sẽ được Passport attach vào request.user
     * 
     * LƯU Ý: Không query database ở đây vì:
     * 1. Tránh query mỗi request
     * 2. Tránh circular dependency với PrismaService (Scope.REQUEST)
     * 
     * Nếu cần verify user status, làm ở AuthService.login()
     */
    async validate(payload: JwtPayload) {
        if (!payload.sub || !payload.tenantId) {
            throw new UnauthorizedException('Token không hợp lệ');
        }

        // Trả về user object - sẽ được attach vào request.user
        // PrismaService sẽ đọc request.user.id_doanh_nghiep
        return {
            id: payload.sub,
            email: payload.email,
            ho_ten: payload.ho_ten || '',
            vai_tro: payload.role,
            id_doanh_nghiep: payload.tenantId,
        };
    }
}
