/**
 * ============================================================
 * APP GATEWAY - WebSocket Server
 * ServiceOS - SaaS Backend - Phase 16
 * ============================================================
 * 
 * Socket.io WebSocket gateway with JWT authentication.
 * Handles client connections, authentication, and message routing.
 */

import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
    WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RealtimeService } from '../services/realtime.service';
import {
    RealtimeEventType,
    SocketUserData,
    MessageEventDto,
    TypingEventDto,
    ConnectionResponseDto,
} from '../dto/realtime.dto';

/**
 * Extended Socket interface with user data
 */
interface AuthenticatedSocket extends Socket {
    userData?: SocketUserData;
}

@WebSocketGateway({
    cors: {
        origin: (origin, callback) => {
            // Allow configured origins or localhost for development
            const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
                'http://localhost:3000',
                'http://localhost:3001',
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    },
    namespace: '/',
    transports: ['websocket', 'polling'],
})
export class AppGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(AppGateway.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
        private readonly realtimeService: RealtimeService,
    ) {}

    // ============================================================
    // LIFECYCLE HOOKS
    // ============================================================

    afterInit(server: Server): void {
        this.realtimeService.setServer(server);
        this.logger.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: AuthenticatedSocket): Promise<void> {
        try {
            // Extract token from handshake
            const token =
                client.handshake.auth?.token ||
                client.handshake.query?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');

            if (!token) {
                this.logger.warn(`Connection rejected: No token provided (${client.id})`);
                client.emit(RealtimeEventType.ERROR, { message: 'Authentication required' });
                client.disconnect();
                return;
            }

            // Verify JWT token
            const payload = await this.verifyToken(token as string);
            if (!payload) {
                this.logger.warn(`Connection rejected: Invalid token (${client.id})`);
                client.emit(RealtimeEventType.ERROR, { message: 'Invalid token' });
                client.disconnect();
                return;
            }

            // Store user data on socket
            const userData: SocketUserData = {
                userId: payload.sub,
                tenantId: payload.tenantId,
                email: payload.email,
                hoTen: payload.ho_ten || '',
                vaiTro: payload.role,
            };
            client.userData = userData;

            // Register connection
            this.realtimeService.registerConnection(client.id, userData);

            // Join user-specific room
            client.join(`user:${userData.userId}`);

            // Join tenant room for broadcasts
            client.join(`tenant:${userData.tenantId}`);

            // Send connection success response
            const response: ConnectionResponseDto = {
                success: true,
                userId: userData.userId,
                rooms: [`user:${userData.userId}`, `tenant:${userData.tenantId}`],
                timestamp: new Date(),
            };
            client.emit(RealtimeEventType.CONNECTED, response);

            this.logger.log(`Client connected: ${client.id} (User: ${userData.userId})`);
        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.emit(RealtimeEventType.ERROR, { message: 'Connection failed' });
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket): void {
        const userData = this.realtimeService.unregisterConnection(client.id);
        if (userData) {
            this.logger.log(`Client disconnected: ${client.id} (User: ${userData.userId})`);
        }
    }

    // ============================================================
    // MESSAGE HANDLERS
    // ============================================================

    /**
     * Handle ping from client (keep-alive)
     */
    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: AuthenticatedSocket): { event: string; data: any } {
        return { event: 'pong', data: { timestamp: Date.now() } };
    }

    /**
     * Join a custom room
     */
    @SubscribeMessage('join:room')
    handleJoinRoom(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { room: string },
    ): void {
        if (!client.userData) {
            throw new WsException('Not authenticated');
        }

        // Validate room access (e.g., tenant-based rooms)
        const room = data.room;
        if (room.startsWith('tenant:') && !room.includes(client.userData.tenantId)) {
            throw new WsException('Access denied to this room');
        }

        client.join(room);
        client.emit('room:joined', { room });
        this.logger.debug(`Client ${client.id} joined room: ${room}`);
    }

    /**
     * Leave a custom room
     */
    @SubscribeMessage('leave:room')
    handleLeaveRoom(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { room: string },
    ): void {
        client.leave(data.room);
        client.emit('room:left', { room: data.room });
    }

    /**
     * Handle chat message
     */
    @SubscribeMessage('message')
    handleMessage(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: MessageEventDto,
    ): void {
        if (!client.userData) {
            throw new WsException('Not authenticated');
        }

        const messageData = {
            from: {
                userId: client.userData.userId,
                hoTen: client.userData.hoTen,
            },
            content: data.content,
            roomId: data.roomId,
            replyTo: data.replyTo,
            timestamp: new Date(),
        };

        // Broadcast to room
        this.server.to(data.roomId).emit(RealtimeEventType.MESSAGE, messageData);
    }

    /**
     * Handle typing indicator
     */
    @SubscribeMessage('typing')
    handleTyping(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: TypingEventDto,
    ): void {
        if (!client.userData) {
            throw new WsException('Not authenticated');
        }

        this.server.to(data.roomId).emit(RealtimeEventType.TYPING, {
            userId: client.userData.userId,
            hoTen: client.userData.hoTen,
            isTyping: data.isTyping,
        });
    }

    /**
     * Mark notification as read
     */
    @SubscribeMessage('notification:read')
    handleNotificationRead(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { notificationId: string },
    ): void {
        if (!client.userData) {
            throw new WsException('Not authenticated');
        }

        // Emit to all user's sockets to sync read status
        this.server.to(`user:${client.userData.userId}`).emit(RealtimeEventType.NOTIFICATION_READ, {
            notificationId: data.notificationId,
        });
    }

    /**
     * Request notification count
     */
    @SubscribeMessage('notification:count')
    handleNotificationCount(
        @ConnectedSocket() client: AuthenticatedSocket,
    ): void {
        if (!client.userData) {
            throw new WsException('Not authenticated');
        }

        // This would typically query the database for unread count
        // For now, just acknowledge the request
        client.emit(RealtimeEventType.NOTIFICATION_COUNT, { count: 0 });
    }

    /**
     * Test notification (for development/demo)
     */
    @SubscribeMessage('test:notification')
    handleTestNotification(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { title?: string; message?: string },
    ): void {
        if (!client.userData) {
            throw new WsException('Not authenticated');
        }

        const notification = {
            id: `test-${Date.now()}`,
            tieuDe: data.title || 'Test Notification',
            noiDung: data.message || 'This is a test notification from the server.',
            loaiThongBao: 'SYSTEM',
            timestamp: new Date(),
        };

        client.emit(RealtimeEventType.NOTIFICATION, notification);
        this.logger.log(`Test notification sent to ${client.userData.userId}`);
    }

    // ============================================================
    // HELPER METHODS
    // ============================================================

    /**
     * Verify JWT token and extract payload
     */
    private async verifyToken(token: string): Promise<any> {
        try {
            const secret = this.configService.get<string>('JWT_SECRET') || 'serviceos-secret-key';
            return this.jwtService.verify(token, { secret });
        } catch (error) {
            this.logger.warn(`Token verification failed: ${error.message}`);
            return null;
        }
    }
}
