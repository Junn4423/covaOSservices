/**
 * SocketManager - Singleton Pattern for Real-time Connection
 * 
 * Features:
 * - Singleton instance management
 * - Connect only when token is verified valid
 * - Auto-disconnect on logout
 * - Error handling with token refresh/logout triggers
 * - Event subscription management
 * - Connection state tracking
 */

import { io, Socket } from "socket.io-client";
import { TokenService } from "./http";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

const SOCKET_OPTIONS = {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    autoConnect: false, // Manual connect for better control
};

// ============================================================================
// TYPES
// ============================================================================

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export interface NotificationPayload {
    id: string;
    tieuDe: string;
    noiDung: string;
    loaiThongBao: string;
    idDoiTuong?: string;
    loaiDoiTuong?: string;
    timestamp?: Date;
}

export interface AlertPayload {
    title: string;
    message: string;
    severity: "info" | "warning" | "error";
    timestamp: Date;
}

export interface BroadcastPayload {
    title: string;
    message: string;
}

type SocketCallback<T = unknown> = (data: T) => void;

interface EventSubscription {
    event: string;
    callback: SocketCallback;
}

// ============================================================================
// SOCKET MANAGER CLASS (Singleton)
// ============================================================================

class SocketManager {
    private static instance: SocketManager | null = null;
    private socket: Socket | null = null;
    private status: ConnectionStatus = "disconnected";
    private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
    private eventSubscriptions: EventSubscription[] = [];
    private reconnectTimer: NodeJS.Timeout | null = null;
    private currentToken: string | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    // Get singleton instance
    public static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    // ============================================================================
    // CONNECTION MANAGEMENT
    // ============================================================================

    /**
     * Connect to socket server with validated token
     * Only connects if token is provided and valid
     */
    public async connect(token: string): Promise<boolean> {
        // Prevent duplicate connections
        if (this.socket?.connected && this.currentToken === token) {
            console.log("[SocketManager] Da ket noi truoc do");
            return true;
        }

        // Disconnect existing connection if token changed
        if (this.socket && this.currentToken !== token) {
            this.disconnect();
        }

        this.currentToken = token;
        this.setStatus("connecting");

        return new Promise((resolve) => {
            this.socket = io(SOCKET_URL, {
                ...SOCKET_OPTIONS,
                auth: { token },
                query: { token },
            });

            // Connection successful
            this.socket.on("connect", () => {
                console.log("[SocketManager] Da ket noi:", this.socket?.id);
                this.setStatus("connected");
                this.clearReconnectTimer();

                // Resubscribe all events
                this.resubscribeEvents();
                resolve(true);
            });

            // Server confirmation
            this.socket.on("connected", (data) => {
                console.log("[SocketManager] Da xac thuc:", data);
            });

            // Disconnection
            this.socket.on("disconnect", (reason) => {
                console.log("[SocketManager] Ngat ket noi:", reason);
                this.setStatus("disconnected");

                // Handle server-initiated disconnect
                if (reason === "io server disconnect") {
                    // Server forced disconnect - might be invalid token
                    this.handleAuthError();
                }
            });

            // Connection error
            this.socket.on("connect_error", async (error) => {
                console.error("[SocketManager] Loi ket noi:", error.message);
                this.setStatus("error");

                // Check if token-related error
                if (this.isTokenError(error)) {
                    await this.handleAuthError();
                } else {
                    // Schedule reconnect for other errors
                    this.scheduleReconnect();
                }

                resolve(false);
            });

            // Generic error
            this.socket.on("error", (error) => {
                console.error("[SocketManager] Loi:", error);
                if (this.isTokenError(error)) {
                    this.handleAuthError();
                }
            });

            // Actually connect
            this.socket.connect();

            // Timeout for connection
            setTimeout(() => {
                if (this.status === "connecting") {
                    console.warn("[SocketManager] Het thoi gian ket noi");
                    this.setStatus("error");
                    resolve(false);
                }
            }, SOCKET_OPTIONS.timeout);
        });
    }

    /**
     * Disconnect from socket server
     */
    public disconnect(): void {
        this.clearReconnectTimer();

        if (this.socket) {
            // Remove all listeners
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }

        this.currentToken = null;
        this.setStatus("disconnected");
        console.log("[SocketManager] Da ngat ket noi");
    }

    // ============================================================================
    // STATUS MANAGEMENT
    // ============================================================================

    private setStatus(status: ConnectionStatus): void {
        this.status = status;
        this.statusListeners.forEach((listener) => listener(status));
    }

    public getStatus(): ConnectionStatus {
        return this.status;
    }

    public isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
        this.statusListeners.add(listener);
        return () => this.statusListeners.delete(listener);
    }

    // ============================================================================
    // EVENT SUBSCRIPTION
    // ============================================================================

    /**
     * Subscribe to a socket event
     * Returns unsubscribe function
     */
    public on<T = unknown>(event: string, callback: SocketCallback<T>): () => void {
        const subscription: EventSubscription = {
            event,
            callback: callback as SocketCallback,
        };

        this.eventSubscriptions.push(subscription);

        if (this.socket) {
            this.socket.on(event, callback);
        }

        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from a socket event
     */
    public off<T = unknown>(event: string, callback: SocketCallback<T>): void {
        this.eventSubscriptions = this.eventSubscriptions.filter(
            (sub) => !(sub.event === event && sub.callback === callback)
        );

        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    /**
     * Resubscribe all events (after reconnection)
     */
    private resubscribeEvents(): void {
        if (!this.socket) return;

        this.eventSubscriptions.forEach(({ event, callback }) => {
            this.socket?.on(event, callback);
        });
    }

    // ============================================================================
    // EMIT EVENTS
    // ============================================================================

    public emit<T = unknown>(event: string, data?: T): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn("[SocketManager] Khong the gui - chua ket noi");
        }
    }

    public joinRoom(room: string): void {
        this.emit("join:room", { room });
    }

    public leaveRoom(room: string): void {
        this.emit("leave:room", { room });
    }

    public markNotificationRead(notificationId: string): void {
        this.emit("notification:read", { notificationId });
    }

    public requestNotificationCount(): void {
        this.emit("notification:count");
    }

    // ============================================================================
    // ERROR HANDLING
    // ============================================================================

    private isTokenError(error: Error | unknown): boolean {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return (
            errorMessage.toLowerCase().includes("token") ||
            errorMessage.toLowerCase().includes("unauthorized") ||
            errorMessage.toLowerCase().includes("authentication")
        );
    }

    private async handleAuthError(): Promise<void> {
        console.warn("[SocketManager] Loi xac thuc socket - khong anh huong dang nhap");

        // Just disconnect the socket - do NOT force logout
        // Socket errors should not affect the user's authenticated state
        // The user can still use the app without real-time features
        this.disconnect();

        // Note: We do NOT call forceLogout() here because:
        // 1. The authentication state is managed by auth.store.ts
        // 2. Socket connection is a secondary feature
        // 3. HTTP requests with the token may still work even if socket fails
        // 4. forceLogout should only be called by HTTP interceptor when API returns 401
    }

    // ============================================================================
    // RECONNECTION
    // ============================================================================

    private scheduleReconnect(): void {
        if (this.reconnectTimer) return;

        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = null;

            const token = TokenService.getAccessToken();
            if (token && this.status !== "connected") {
                console.log("[SocketManager] Dang thu ket noi lai...");
                await this.connect(token);
            }
        }, SOCKET_OPTIONS.reconnectionDelay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export singleton instance getter
export const getSocketManager = (): SocketManager => SocketManager.getInstance();

// Export convenience functions
export const socketManager = SocketManager.getInstance();

export default SocketManager;
