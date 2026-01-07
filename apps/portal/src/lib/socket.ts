/**
 * Socket.io Client Configuration
 * WebSocket connection with JWT authentication
 */

import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export type SocketEventType =
  | "connected"
  | "disconnected"
  | "error"
  | "notification"
  | "notification:read"
  | "notification:count"
  | "message"
  | "typing"
  | "alert"
  | "broadcast";

export interface NotificationEvent {
  id: string;
  tieuDe: string;
  noiDung: string;
  loaiThongBao: string;
  idDoiTuong?: string;
  loaiDoiTuong?: string;
  timestamp?: Date;
}

export interface AlertEvent {
  title: string;
  message: string;
  severity: "info" | "warning" | "error";
  timestamp: Date;
}

export interface BroadcastEvent {
  title: string;
  message: string;
}

let socket: Socket | null = null;

/**
 * Initialize socket connection with JWT token
 */
export function initializeSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    query: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  // Connection events
  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket?.id);
  });

  socket.on("connected", (data) => {
    console.log("[Socket] Authenticated:", data);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
  });

  socket.on("error", (error) => {
    console.error("[Socket] Error:", error);
  });

  return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Send a ping to keep connection alive
 */
export function sendPing(): void {
  socket?.emit("ping");
}

/**
 * Join a room
 */
export function joinRoom(room: string): void {
  socket?.emit("join:room", { room });
}

/**
 * Leave a room
 */
export function leaveRoom(room: string): void {
  socket?.emit("leave:room", { room });
}

/**
 * Mark notification as read via socket
 */
export function markNotificationRead(notificationId: string): void {
  socket?.emit("notification:read", { notificationId });
}

/**
 * Request notification count
 */
export function requestNotificationCount(): void {
  socket?.emit("notification:count");
}

/**
 * Send test notification (for development)
 */
export function sendTestNotification(title?: string, message?: string): void {
  socket?.emit("test:notification", { title, message });
}

/**
 * Send a message to a room
 */
export function sendMessage(roomId: string, content: string, replyTo?: string): void {
  socket?.emit("message", { roomId, content, replyTo });
}

/**
 * Send typing indicator
 */
export function sendTyping(roomId: string, isTyping: boolean): void {
  socket?.emit("typing", { roomId, isTyping });
}

export default socket;
