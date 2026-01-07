/**
 * ============================================================
 * REALTIME MODULE - WebSocket Integration
 * ServiceOS - SaaS Backend - Phase 16
 * ============================================================
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppGateway } from './gateways/app.gateway';
import { RealtimeService } from './services/realtime.service';

@Global() // Make RealtimeService available globally
@Module({
    imports: [
        ConfigModule,
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET || 'serviceos-secret-key',
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    providers: [AppGateway, RealtimeService],
    exports: [RealtimeService],
})
export class RealtimeModule {}
