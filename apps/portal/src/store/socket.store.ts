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

interface SocketState {
  // State
  isConnected: boolean;
  connectionError: string | null;
  notifications: NotificationEvent[];
  unreadCount: number;

  // Actions
  connect: (token: string) => void;
  disconnect: () => void;
  addNotification: (notification: NotificationEvent) => void;
  clearNotifications: () => void;
  setUnreadCount: (count: number) => void;
  sendTestNotification: (title?: string, message?: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  // Initial state
  isConnected: false,
  connectionError: null,
  notifications: [],
  unreadCount: 0,

  // Connect to WebSocket
  connect: (token: string) => {
    const socket = initializeSocket(token);

    // Connection events
    socket.on("connect", () => {
      set({ isConnected: true, connectionError: null });
    });

    socket.on("connected", (data) => {
      console.log("[SocketStore] Authenticated:", data);
    });

    socket.on("disconnect", () => {
      set({ isConnected: false });
    });

    socket.on("connect_error", (error) => {
      set({ connectionError: error.message });
    });

    // Notification events
    socket.on("notification", (data: NotificationEvent) => {
      set((state) => ({
        notifications: [data, ...state.notifications].slice(0, 50), // Keep last 50
        unreadCount: state.unreadCount + 1,
      }));
    });

    socket.on("notification:count", (data: { count: number }) => {
      set({ unreadCount: data.count });
    });

    socket.on("notification:read", (data: { notificationId: string }) => {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === data.notificationId ? { ...n, read: true } : n
        ),
      }));
    });

    // Alert events
    socket.on("alert", (data: AlertEvent) => {
      // Handle alert - could trigger a toast notification
      console.log("[SocketStore] Alert received:", data);
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
    });

    // Broadcast events
    socket.on("broadcast", (data: BroadcastEvent) => {
      console.log("[SocketStore] Broadcast received:", data);
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

  // Send test notification
  sendTestNotification: (title?: string, message?: string) => {
    socketSendTest(title, message);
  },
}));
