/**
 * Socket.io Client Configuration
 * @deprecated Use @/lib/socket-manager instead
 * 
 * This file re-exports from the new socket-manager for backwards compatibility
 */

import { socketManager, ConnectionStatus, NotificationPayload, AlertPayload, BroadcastPayload } from "./socket-manager";

// Re-export types
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

/**
 * @deprecated Use socketManager.connect() instead
 */
export function initializeSocket(token: string) {
  socketManager.connect(token);
  return socketManager;
}

/**
 * @deprecated Use socketManager.disconnect() instead
 */
export function disconnectSocket() {
  socketManager.disconnect();
}

/**
 * @deprecated Use socketManager directly
 */
export function getSocket() {
  return socketManager;
}

/**
 * @deprecated Use socketManager.isConnected() instead
 */
export function isSocketConnected(): boolean {
  return socketManager.isConnected();
}

/**
 * @deprecated Use socketManager.emit() instead
 */
export function sendTestNotification(title: string, message: string) {
  socketManager.emit("test:notification", { title, message });
}

export { socketManager };
export type { ConnectionStatus };
