/**
 * Socket Store - Zustand State Management
 * Handles WebSocket connection state and real-time events
 */

import { create } from "zustand";
import { Socket } from "socket.io-client";
import {
  initializeSocket,
  disconnectSocket,
  getSocket,
  isSocketConnected,
  sendTestNotification as socketSendTest,
} from "@/lib/socket";
import type { NotificationEvent, AlertEvent, BroadcastEvent } from "@/lib/socket";

// Callback type for toast notifications
type ToastCallback = (notification: {
  title: string;
  description: string;
  variant: "default" | "destructive";
}) => void;

interface SocketState {
  // State
  isConnected: boolean;
  connectionError: string | null;
  notifications: NotificationEvent[];
  unreadCount: number;
  toastCallback: ToastCallback | null;

  // Actions
  connect: (token: string) => void;
  disconnect: () => void;
  addNotification: (notification: NotificationEvent) => void;
  clearNotifications: () => void;
  setUnreadCount: (count: number) => void;
  sendTestNotification: (title?: string, message?: string) => void;
  setToastCallback: (callback: ToastCallback | null) => void;
  markNotificationRead: (id: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  // Initial state
  isConnected: false,
  connectionError: null,
  notifications: [],
  unreadCount: 0,
  toastCallback: null,

  // Set toast callback for showing notifications
  setToastCallback: (callback) => set({ toastCallback: callback }),

  // Connect to WebSocket
  connect: (token: string) => {
    const socket = initializeSocket(token);

    // Connection events
    socket.on("connect", () => {
      set({ isConnected: true, connectionError: null });
    });

    socket.on("connected", (data) => {
      console.log("[SocketStore] Đã xác thực:", data);
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("connect_error", (error) => {
      set({ connectionError: error.message });
    });

    // Notification events
    socket.on("notification", (data: NotificationEvent) => {
      const { toastCallback } = get();

      set((state) => ({
        notifications: [data, ...state.notifications].slice(0, 50), // Keep last 50
        unreadCount: state.unreadCount + 1,
      }));

      // Show toast notification if callback is set
      if (toastCallback) {
        toastCallback({
          title: data.tieuDe || "Thông báo mới",
          description: data.noiDung || "",
          variant: "default",
        });
      }
    });

    socket.on("notification:count", (data: { count: number }) => {
      set({ unreadCount: data.count });
    });

    socket.on("notification:read", (data: { notificationId: string }) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === data.notificationId ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    });

    // Alert events
    socket.on("alert", (data: AlertEvent) => {
      const { toastCallback } = get();
      console.log("[SocketStore] Cảnh báo nhận được:", data);

      set((state) => ({
        notifications: [
          {
            id: `alert-${Date.now()}`,
            tieuDe: data.title,
            noiDung: data.message,
            loaiThongBao: `ALERT_${data.severity.toUpperCase()}`,
            timestamp: data.timestamp,
          },
          ...state.notifications,
        ].slice(0, 50),
      }));

      // Show toast for alerts
      if (toastCallback) {
        toastCallback({
          title: data.title,
          description: data.message,
          variant: data.severity === "error" ? "destructive" : "default",
        });
      }
    });

    // Broadcast events
    socket.on("broadcast", (data: BroadcastEvent) => {
      const { toastCallback } = get();
      console.log("[SocketStore] Phát sóng nhận được:", data);

      set((state) => ({
        notifications: [
          {
            id: `broadcast-${Date.now()}`,
            tieuDe: data.title,
            noiDung: data.message,
            loaiThongBao: "BROADCAST",
            timestamp: new Date(),
          },
          ...state.notifications,
        ].slice(0, 50),
      }));

      // Show toast for broadcasts
      if (toastCallback) {
        toastCallback({
          title: data.title,
          description: data.message,
          variant: "default",
        });
      }
    });

    // Check initial connection status
    set({ isConnected: isSocketConnected() });
  },

  // Disconnect from WebSocket
  disconnect: () => {
    disconnectSocket();
    set({ isConnected: false, connectionError: null });
  },

  // Add notification manually (for testing)
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Clear all notifications
  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  // Set unread count
  setUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  // Mark notification as read
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  // Send test notification
  sendTestNotification: (title?: string, message?: string) => {
    socketSendTest(
      title || "Thông báo thử nghiệm",
      message || "Đây là thông báo thử nghiệm từ client."
    );
  },
}));

