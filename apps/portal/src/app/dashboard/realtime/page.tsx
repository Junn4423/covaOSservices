/**
 * Realtime Demo Page
 * Testing WebSocket connection and notifications
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSocketStore } from "@/stores";
import { socketManager } from "@/lib/socket-manager";

export default function RealtimeDemoPage() {
  const { toast } = useToast();
  const { status, notifications, unreadCount, clearNotifications, addNotification } = useSocketStore();

  const [testTitle, setTestTitle] = useState("Thong bao thu nghiem");
  const [testMessage, setTestMessage] = useState("Day la thong bao thu nghiem tu bang dieu khien.");

  const isConnected = status === "connected";
  const connectionError = status === "error" ? "Loi ket noi" : null;

  // Socket is already connected by auth store - no need to connect here

  // Send test notification via socket
  const handleSendTest = () => {
    if (!isConnected) {
      toast({
        title: "Chua ket noi",
        description: "WebSocket chua ket noi. Vui long doi hoac tai lai trang.",
        variant: "destructive",
      });
      return;
    }

    socketManager.emit("test:notification", { title: testTitle, message: testMessage });
    toast({
      title: "Da gui thu",
      description: "Yeu cau thong bao thu nghiem da duoc gui den may chu.",
      variant: "default",
    });
  };

  // Add local notification (for testing UI without socket)
  const handleAddLocal = () => {
    addNotification({
      id: `local-${Date.now()}`,
      tieuDe: testTitle,
      noiDung: testMessage,
      loaiThongBao: "LOCAL_TEST",
      timestamp: new Date(),
    });
    toast({
      title: "Da them thong bao cuc bo",
      description: "Da them vao danh sach thong bao (chi tren may cua ban)",
      variant: "default",
    });
  };

  // Format timestamp
  const formatTime = (date?: Date | string): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get notification type label in Vietnamese
  const getNotificationTypeLabel = (type?: string): string => {
    if (!type) return "CHUNG";
    if (type.includes("ALERT")) return "CANH BAO";
    if (type.includes("BROADCAST")) return "PHAT SONG";
    if (type.includes("LOCAL")) return "CUC BO";
    if (type.includes("SYSTEM")) return "HE THONG";
    return type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Thong bao Thoi gian thuc
        </h2>
        <p className="text-muted-foreground">
          Kiem tra ket noi WebSocket va thong bao truc tiep
        </p>
      </div>

      {/* Connection status */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Trang thai Ket noi</CardTitle>
          <CardDescription>
            Ket noi WebSocket den may chu backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-full transition-all duration-300 ${isConnected ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50" : "bg-red-500"
                  }`}
              />
              <span className="font-medium">
                {isConnected ? "Da ket noi" : status === "connecting" ? "Dang ket noi..." : "Chua ket noi"}
              </span>
            </div>

            {connectionError && (
              <span className="text-sm text-destructive">
                Loi: {connectionError}
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <p className="text-sm text-muted-foreground">URL Socket</p>
              <p className="font-mono text-sm mt-1">
                {process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"}
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <p className="text-sm text-muted-foreground">So chua doc</p>
              <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {unreadCount}
              </p>
            </div>
            <div className="rounded-lg border p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <p className="text-sm text-muted-foreground">Tong thong bao</p>
              <p className="text-2xl font-bold mt-1 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {notifications.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send test notification */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Gui thong bao thu nghiem</CardTitle>
          <CardDescription>
            Gui thong bao thu nghiem qua may chu WebSocket
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Tieu de</Label>
              <Input
                id="title"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="Tieu de thong bao"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="message">Noi dung</Label>
              <Input
                id="message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Noi dung thong bao"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={handleSendTest}
              disabled={!isConnected}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              Gui qua Socket
            </Button>
            <Button onClick={handleAddLocal} variant="outline" className="transition-all duration-200 hover:shadow-md">
              Them cuc bo (Thu UI)
            </Button>
            <Button onClick={clearNotifications} variant="destructive" className="transition-all duration-200">
              Xoa tat ca
            </Button>
          </div>

          {!isConnected && (
            <p className="text-sm text-muted-foreground p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
              Luu y: WebSocket chua ket noi. Nut "Gui qua Socket" can ket noi dang hoat dong.
              Ban van co the thu giao dien voi "Them cuc bo".
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notification feed */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Danh sach thong bao</CardTitle>
          <CardDescription>
            Thong bao thoi gian thuc nhan tu may chu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="text-4xl text-gray-300 mb-2">?</div>
              <p className="text-muted-foreground">Chua co thong bao nao</p>
              <p className="text-sm text-muted-foreground mt-1">
                Gui thong bao thu nghiem hoac doi su kien tu may chu
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className="flex gap-4 p-4 rounded-lg border bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Icon based on type */}
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.loaiThongBao?.includes("ALERT")
                      ? "bg-red-100 text-red-600 dark:bg-red-900/50"
                      : notification.loaiThongBao?.includes("BROADCAST")
                        ? "bg-purple-100 text-purple-600 dark:bg-purple-900/50"
                        : notification.loaiThongBao?.includes("LOCAL")
                          ? "bg-gray-100 text-gray-600 dark:bg-gray-700"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/50"
                      }`}
                  >
                    <span className="text-sm font-bold">
                      {notification.loaiThongBao?.[0] || "N"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">{notification.tieuDe}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {notification.noiDung}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                        {getNotificationTypeLabel(notification.loaiThongBao)}
                      </span>
                      {notification.idDoiTuong && (
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                          {notification.loaiDoiTuong}: {notification.idDoiTuong.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Hướng dẫn Sử dụng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <p className="font-medium text-foreground">1. Kết nối WebSocket</p>
            <p>
              Khi bạn đăng nhập, frontend tự động kết nối đến máy chủ WebSocket
              sử dụng JWT token để xác thực.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
            <p className="font-medium text-foreground">2. Thông báo theo Phòng</p>
            <p>
              ỗi người dùng tự động tham gia phòng cá nhân (user:userId) và phòng
              doanh nghiệp (tenant:tenantId) để nhận thông báo trực tiếp.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950">
            <p className="font-medium text-foreground">3. Thông báo thử nghiệm</p>
            <p>
              nút "Gửi qua Socket" gửi sự kiện test:notification đến máy chủ,
              sau đó máy chủ gửi thông báo lại cho socket của bạn.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950">
            <p className="font-medium text-foreground">4. Tích hợp Sản xuất</p>
            <p>
              Trong môi trường sản xuất, các dịch vụ backend sử dụng RealtimeService.notifyUser()
              để đẩy thông báo đến người dùng cụ thể theo thời gian thực.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
