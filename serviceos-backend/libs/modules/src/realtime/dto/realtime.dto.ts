/**
 * ============================================================
 * REALTIME DTOs - WebSocket Data Transfer Objects
 * ServiceOS - SaaS Backend - Phase 16
 * ============================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

/**
 * Event types for real-time notifications
 */
export enum RealtimeEventType {
    // System events
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    ERROR = 'error',

    // Notification events
    NOTIFICATION = 'notification',
    NOTIFICATION_READ = 'notification:read',
    NOTIFICATION_COUNT = 'notification:count',

    // Job/Task events
    JOB_CREATED = 'job:created',
    JOB_UPDATED = 'job:updated',
    JOB_ASSIGNED = 'job:assigned',
    JOB_COMPLETED = 'job:completed',

    // Chat/Message events
    MESSAGE = 'message',
    TYPING = 'typing',
    PRESENCE = 'presence',

    // System alerts
    ALERT = 'alert',
    BROADCAST = 'broadcast',
}

/**
 * Socket authentication payload
 */
export interface SocketAuthPayload {
    token: string;
}

/**
 * Socket user data (after authentication)
 */
export interface SocketUserData {
    userId: string;
    tenantId: string;
    email: string;
    hoTen: string;
    vaiTro: string;
}

/**
 * Base realtime event payload
 */
export class RealtimeEventDto {
    @ApiProperty({ enum: RealtimeEventType })
    @IsEnum(RealtimeEventType)
    event: RealtimeEventType;

    @ApiProperty({ description: 'Event payload data' })
    @IsObject()
    data: Record<string, any>;

    @ApiPropertyOptional({ description: 'Target user ID (for direct messages)' })
    @IsOptional()
    @IsString()
    targetUserId?: string;

    @ApiPropertyOptional({ description: 'Target room name' })
    @IsOptional()
    @IsString()
    room?: string;
}

/**
 * Notification event payload
 */
export class NotificationEventDto {
    @ApiProperty()
    @IsString()
    id: string;

    @ApiProperty()
    @IsString()
    tieuDe: string;

    @ApiProperty()
    @IsString()
    noiDung: string;

    @ApiProperty()
    @IsString()
    loaiThongBao: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    idDoiTuong?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    loaiDoiTuong?: string;
}

/**
 * Message event payload
 */
export class MessageEventDto {
    @ApiProperty()
    @IsString()
    content: string;

    @ApiProperty()
    @IsString()
    roomId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    replyTo?: string;
}

/**
 * Broadcast event payload
 */
export class BroadcastEventDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    message: string;

    @ApiPropertyOptional({ description: 'Broadcast to specific tenant only' })
    @IsOptional()
    @IsString()
    tenantId?: string;
}

/**
 * Typing indicator payload
 */
export class TypingEventDto {
    @ApiProperty()
    @IsString()
    roomId: string;

    @ApiProperty()
    isTyping: boolean;
}

/**
 * Connection response
 */
export class ConnectionResponseDto {
    @ApiProperty()
    success: boolean;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    rooms: string[];

    @ApiProperty()
    timestamp: Date;
}
