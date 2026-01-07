/**
 * Socket Store - Real-time State Management
 * 
 * Features:
 * - Uses SocketManager singleton
 * - Manages socket connection state
 * - Handles notifications and events
 * - Provides reactive status updates
 */

import { create } from "zustand";
import { socketManager, ConnectionStatus, NotificationPayload, AlertPayload, BroadcastPayload } from "@/lib/socket-manager";

// ============================================================================
// TYPES
// ============================================================================

type ToastCallback = (notification: {
    title: string;
    description: string;
    variant: "default" | "destructive";
}) => void;

interface SocketState {
    // State
    status: ConnectionStatus;
    notifications: NotificationPayload[];
    unreadCount: number;
    toastCallback: ToastCallback | null;

    // Actions
    connect: (token: string) => Promise<void>;
    disconnect: () => void;
    addNotification: (notification: NotificationPayload) => void;
    clearNotifications: () => void;
    setUnreadCount: (count: number) => void;
    markNotificationRead: (id: string) => void;
    setToastCallback: (callback: ToastCallback | null) => void;
}

// ============================================================================
// SOCKET STORE
// ============================================================================

export const useSocketStore = create<SocketState>((set, get) => {
    // Subscribe to status changes from SocketManager
    socketManager.onStatusChange((status) => {
        set({ status });
    });

    return {
        // ========================================
        // Initial State
        // ========================================
        status: socketManager.getStatus(),
        notifications: [],
        unreadCount: 0,
        toastCallback: null,

        // ========================================
        // Set Toast Callback
        // ========================================
        setToastCallback: (callback) => set({ toastCallback: callback }),

        // ========================================
        // Connect
        // ========================================
        connect: async (token: string) => {
            const connected = await socketManager.connect(token);

            if (connected) {
                // Subscribe to socket events
                socketManager.on<NotificationPayload>("notification", (data) => {
                    const { toastCallback } = get();

                    set((state) => ({
                        notifications: [data, ...state.notifications].slice(0, 50),
                        unreadCount: state.unreadCount + 1,
                    }));

                    if (toastCallback) {
                        toastCallback({
                            title: data.tieuDe || "Thông báo mới",
                            description: data.noiDung || "",
                            variant: "default",
                        });
                    }
                });

                socketManager.on<{ count: number }>("notification:count", (data) => {
                    set({ unreadCount: data.count });
                });

                socketManager.on<{ notificationId: string }>("notification:read", (data) => {
                    set((state) => ({
                        notifications: state.notifications.map((n) =>
                            n.id === data.notificationId ? { ...n, read: true } : n
                        ),
                        unreadCount: Math.max(0, state.unreadCount - 1),
                    }));
                });

                socketManager.on<AlertPayload>("alert", (data) => {
                    const { toastCallback } = get();

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

                    if (toastCallback) {
                        toastCallback({
                            title: data.title,
                            description: data.message,
                            variant: data.severity === "error" ? "destructive" : "default",
                        });
                    }
                });

                socketManager.on<BroadcastPayload>("broadcast", (data) => {
                    const { toastCallback } = get();

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

                    if (toastCallback) {
                        toastCallback({
                            title: data.title,
                            description: data.message,
                            variant: "default",
                        });
                    }
                });
            }
        },

        // ========================================
        // Disconnect
        // ========================================
        disconnect: () => {
            socketManager.disconnect();
            set({ status: "disconnected" });
        },

        // ========================================
        // Add Notification (Manual)
        // ========================================
        addNotification: (notification) => {
            set((state) => ({
                notifications: [notification, ...state.notifications].slice(0, 50),
                unreadCount: state.unreadCount + 1,
            }));
        },

        // ========================================
        // Clear All Notifications
        // ========================================
        clearNotifications: () => {
            set({ notifications: [], unreadCount: 0 });
        },

        // ========================================
        // Set Unread Count
        // ========================================
        setUnreadCount: (count) => set({ unreadCount: count }),

        // ========================================
        // Mark Notification Read
        // ========================================
        markNotificationRead: (id) => {
            socketManager.markNotificationRead(id);
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            }));
        },
    };
});

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

export const getSocketStatus = (): ConnectionStatus => {
    return useSocketStore.getState().status;
};

export const isSocketConnected = (): boolean => {
    return useSocketStore.getState().status === "connected";
};

export default useSocketStore;
