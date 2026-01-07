/**
 * ============================================================
 * REALTIME SERVICE - WebSocket Business Logic
 * ServiceOS - SaaS Backend - Phase 16
 * ============================================================
 * 
 * Handles real-time notification delivery and user presence.
 * Used by other services to push notifications to connected clients.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
    RealtimeEventType,
    SocketUserData,
    NotificationEventDto,
    BroadcastEventDto,
} from '../dto/realtime.dto';

@Injectable()
export class RealtimeService {
    private readonly logger = new Logger(RealtimeService.name);
    private server: Server | null = null;

    // Track connected users: userId -> Set of socket IDs
    private connectedUsers: Map<string, Set<string>> = new Map();

    // Track user data for each socket
    private socketUserData: Map<string, SocketUserData> = new Map();

    /**
     * Set the Socket.io server instance
     * Called by AppGateway on initialization
     */
    setServer(server: Server): void {
        this.server = server;
        this.logger.log('WebSocket server registered with RealtimeService');
    }

    /**
     * Register a connected user
     */
    registerConnection(socketId: string, userData: SocketUserData): void {
        const { userId } = userData;

        // Store user data for this socket
        this.socketUserData.set(socketId, userData);

        // Add socket to user's connection set
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, new Set());
        }
        this.connectedUsers.get(userId)!.add(socketId);

        this.logger.log(`User ${userId} connected via socket ${socketId}`);
    }

    /**
     * Unregister a disconnected user
     */
    unregisterConnection(socketId: string): SocketUserData | null {
        const userData = this.socketUserData.get(socketId);
        if (!userData) return null;

        const { userId } = userData;

        // Remove socket from user's connection set
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
            userSockets.delete(socketId);
            if (userSockets.size === 0) {
                this.connectedUsers.delete(userId);
            }
        }

        // Remove socket user data
        this.socketUserData.delete(socketId);

        this.logger.log(`User ${userId} disconnected from socket ${socketId}`);
        return userData;
    }

    /**
     * Get user data for a socket
     */
    getSocketUserData(socketId: string): SocketUserData | null {
        return this.socketUserData.get(socketId) || null;
    }

    /**
     * Check if a user is online
     */
    isUserOnline(userId: string): boolean {
        return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
    }

    /**
     * Get online users count
     */
    getOnlineUsersCount(): number {
        return this.connectedUsers.size;
    }

    /**
     * Get all socket IDs for a user
     */
    getUserSockets(userId: string): string[] {
        const sockets = this.connectedUsers.get(userId);
        return sockets ? Array.from(sockets) : [];
    }

    // ============================================================
    // NOTIFICATION METHODS - Used by other services
    // ============================================================

    /**
     * Send notification to a specific user
     * Used by ThongBaoService after creating a notification
     */
    notifyUser(userId: string, notification: NotificationEventDto): boolean {
        if (!this.server) {
            this.logger.warn('WebSocket server not initialized');
            return false;
        }

        const socketIds = this.getUserSockets(userId);
        if (socketIds.length === 0) {
            this.logger.debug(`User ${userId} is offline, notification queued`);
            return false;
        }

        // Emit to all user's connected sockets
        socketIds.forEach((socketId) => {
            this.server!.to(socketId).emit(RealtimeEventType.NOTIFICATION, notification);
        });

        this.logger.log(`Notification sent to user ${userId} on ${socketIds.length} socket(s)`);
        return true;
    }

    /**
     * Send notification count update to a user
     */
    updateNotificationCount(userId: string, count: number): void {
        if (!this.server) return;

        const socketIds = this.getUserSockets(userId);
        socketIds.forEach((socketId) => {
            this.server!.to(socketId).emit(RealtimeEventType.NOTIFICATION_COUNT, { count });
        });
    }

    /**
     * Broadcast to all users in a tenant
     */
    broadcastToTenant(tenantId: string, event: RealtimeEventType, data: any): void {
        if (!this.server) return;

        const room = `tenant:${tenantId}`;
        this.server.to(room).emit(event, data);
        this.logger.log(`Broadcast to tenant ${tenantId}: ${event}`);
    }

    /**
     * Broadcast to all connected users
     */
    broadcastToAll(broadcast: BroadcastEventDto): void {
        if (!this.server) return;

        if (broadcast.tenantId) {
            this.broadcastToTenant(broadcast.tenantId, RealtimeEventType.BROADCAST, {
                title: broadcast.title,
                message: broadcast.message,
            });
        } else {
            this.server.emit(RealtimeEventType.BROADCAST, {
                title: broadcast.title,
                message: broadcast.message,
            });
            this.logger.log(`Global broadcast: ${broadcast.title}`);
        }
    }

    /**
     * Send job update to assigned users
     */
    notifyJobUpdate(
        jobId: string,
        eventType: RealtimeEventType,
        data: any,
        userIds: string[],
    ): void {
        if (!this.server) return;

        userIds.forEach((userId) => {
            this.notifyUser(userId, {
                id: jobId,
                tieuDe: data.title || 'Job Update',
                noiDung: data.message || '',
                loaiThongBao: eventType,
                idDoiTuong: jobId,
                loaiDoiTuong: 'CONG_VIEC',
            });
        });
    }

    /**
     * Send alert to specific users
     */
    sendAlert(userIds: string[], title: string, message: string, severity: 'info' | 'warning' | 'error' = 'info'): void {
        if (!this.server) return;

        const alertData = { title, message, severity, timestamp: new Date() };

        userIds.forEach((userId) => {
            const socketIds = this.getUserSockets(userId);
            socketIds.forEach((socketId) => {
                this.server!.to(socketId).emit(RealtimeEventType.ALERT, alertData);
            });
        });
    }

    /**
     * Emit to a specific room
     */
    emitToRoom(room: string, event: RealtimeEventType, data: any): void {
        if (!this.server) return;
        this.server.to(room).emit(event, data);
    }

    /**
     * Join a socket to a room
     */
    joinRoom(socketId: string, room: string): void {
        if (!this.server) return;
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
            socket.join(room);
            this.logger.debug(`Socket ${socketId} joined room ${room}`);
        }
    }

    /**
     * Leave a room
     */
    leaveRoom(socketId: string, room: string): void {
        if (!this.server) return;
        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
            socket.leave(room);
            this.logger.debug(`Socket ${socketId} left room ${room}`);
        }
    }
}
