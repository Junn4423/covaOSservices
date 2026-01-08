/**
 * Notifications - Trang Trung tam Thong bao
 * Module NotifyHub - ServiceOS
 * 
 * Features:
 * - Danh sach thong bao
 * - Phan loai thong bao
 * - Danh dau da doc
 * - Thiet lap thong bao
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import httpClient, { type PaginatedResponse } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface ThongBao {
    id: string;
    tieu_de: string;
    noi_dung: string;
    loai: "system" | "order" | "task" | "alert" | "info";
    da_doc: boolean;
    ngay_tao: string;
    link?: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const LOAI_THONG_BAO: Record<string, { label: string; icon: string; className: string }> = {
    system: { label: "Hệ thống", icon: "⚙️", className: "bg-gray-100 text-gray-700" },
    order: { label: "Đơn hàng", icon: "📦", className: "bg-blue-100 text-blue-700" },
    task: { label: "Công việc", icon: "✅", className: "bg-green-100 text-green-700" },
    alert: { label: "Cảnh báo", icon: "⚠️", className: "bg-red-100 text-red-700" },
    info: { label: "Thông tin", icon: "ℹ️", className: "bg-purple-100 text-purple-700" },
};

// ============================================================================
// NOTIFICATION ITEM
// ============================================================================

interface NotificationItemProps {
    notification: ThongBao;
    onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const config = LOAI_THONG_BAO[notification.loai] || LOAI_THONG_BAO.info;
    
    return (
        <div
            className={cn(
                "p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer",
                !notification.da_doc && "bg-blue-50/50"
            )}
            onClick={() => {
                if (!notification.da_doc) {
                    onMarkAsRead(notification.id);
                }
            }}
        >
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        config.className
                    )}>
                        <span className="text-lg">{config.icon}</span>
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <p className={cn(
                                "text-sm truncate",
                                !notification.da_doc ? "font-semibold text-gray-900" : "text-gray-700"
                            )}>
                                {notification.tieu_de}
                            </p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {notification.noi_dung}
                            </p>
                        </div>
                        {!notification.da_doc && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            config.className
                        )}>
                            {config.label}
                        </span>
                        <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.ngay_tao)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString("vi-VN");
}

// ============================================================================
// PAGE
// ============================================================================

export default function NotificationsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("all");
    const [page] = useState(1);
    const limit = 20;

    // Fetch notifications
    const { data, isLoading } = useQuery({
        queryKey: ["notifications", page, limit, activeTab],
        queryFn: async () => {
            const params: Record<string, unknown> = { page, limit };
            if (activeTab !== "all" && activeTab !== "unread") {
                params.loai = activeTab;
            }
            if (activeTab === "unread") {
                params.da_doc = false;
            }
            const response = await httpClient.get<PaginatedResponse<ThongBao>>("/notifications", {
                params,
            });
            return response.data;
        },
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await httpClient.patch(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        },
    });

    // Mark all as read
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            await httpClient.patch("/notifications/read-all");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            toast({ title: "Đã đánh dấu tất cả là đã đọc" });
        },
    });

    const notifications = data?.data || [];
    const unreadCount = notifications.filter(n => !n.da_doc).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Trung tâm thông báo</h1>
                    <p className="text-gray-500 mt-1">
                        {unreadCount > 0 
                            ? `Bạn có ${unreadCount} thông báo chưa đọc`
                            : "Không có thông báo mới"
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => toast({ title: "Cài đặt", description: "Đang phát triển" })}
                    >
                        ⚙️ Cài đặt
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
                    >
                        ✓ Đọc tất cả
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {Object.entries(LOAI_THONG_BAO).map(([key, config]) => (
                    <div
                        key={key}
                        className={cn(
                            "rounded-xl border p-4 bg-white cursor-pointer hover:shadow-md transition-shadow",
                            activeTab === key && "ring-2 ring-blue-500"
                        )}
                        style={{ borderColor: "var(--gray-200)" }}
                        onClick={() => setActiveTab(key)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center",
                                config.className
                            )}>
                                <span className="text-lg">{config.icon}</span>
                            </div>
                            <div>
                                <p className="text-lg font-bold text-gray-900">0</p>
                                <p className="text-xs text-gray-500">{config.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-100">
                    <TabsTrigger value="all">
                        Tất cả
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="relative">
                        Chưa đọc
                        {unreadCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="order">Đơn hàng</TabsTrigger>
                    <TabsTrigger value="task">Công việc</TabsTrigger>
                    <TabsTrigger value="alert">Cảnh báo</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách thông báo</CardTitle>
                            <CardDescription>
                                {activeTab === "all" && "Tất cả thông báo của bạn"}
                                {activeTab === "unread" && "Các thông báo chưa đọc"}
                                {activeTab !== "all" && activeTab !== "unread" && 
                                    `Thông báo ${LOAI_THONG_BAO[activeTab]?.label.toLowerCase()}`
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-gray-500 mt-2">Đang tải...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">🔔</span>
                                    </div>
                                    <p className="text-gray-500">Không có thông báo nào</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
