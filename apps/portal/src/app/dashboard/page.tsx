"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore, useSocketStore } from "@/store";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { isConnected, unreadCount } = useSocketStore();

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Xin chao, {user?.ho_ten || "Ban"}!
        </h2>
        <p className="text-muted-foreground mt-2">
          Đây là tổng quan của ServiceOS Portal
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái kết nối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full transition-all duration-300 ${isConnected ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50" : "bg-red-500"
                  }`}
              />
              <span className="text-2xl font-bold">
                {isConnected ? "Truc tuyen" : "Ngoai tuyen"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              WebSocket {isConnected ? "da ket noi" : "chua ket noi"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thong bao</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {unreadCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Thông báo chưa đọc
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vai trò</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {user?.vai_tro || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Vai trò tài khoản của bạn
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950 dark:to-teal-950">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh nghiệp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              {user?.doanh_nghiep?.ten_doanh_nghiep || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổ chức của bạn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/dashboard/storage">
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-0 shadow-lg hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-lg">
                  S
                </span>
                Quản lý Lưu trữ
              </CardTitle>
              <CardDescription>
                Thử nghiệm chức năng tải lên tệp với MinIO/S3
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  Tải lên hình ảnh (JPEG, PNG, WebP)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  Tải lên tài liệu (PDF, Word, Excel)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  Xem tệp đã tải lên với URL công khai
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  Xóa tệp khỏi hệ thống lưu trữ
                </li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/realtime">
          <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full border-0 shadow-lg hover:scale-[1.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-white text-sm font-bold shadow-lg">
                  R
                </span>
                Thông báo Thời gian thực
              </CardTitle>
              <CardDescription>
                Thu nghiệm kết nối WebSocket và thông báo trực tiếp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Gửi thông báo thử nghiệm
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Xem danh sách thông báo thời gian thực
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Theo dõi trạng thái kết nối WebSocket
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Thử nghiệm tin nhắn phát sóng
                </li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* API Info */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Thông tin API</CardTitle>
          <CardDescription>
            Chi tiết kết nối Backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <p className="text-sm font-medium">API URL</p>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
              <p className="text-sm font-medium">WebSocket URL</p>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
