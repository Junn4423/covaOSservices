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
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.ho_ten || "User"}!
        </h2>
        <p className="text-muted-foreground mt-2">
          Here is an overview of your ServiceOS Portal
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-2xl font-bold">
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              WebSocket {isConnected ? "connected" : "disconnected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              Unread notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {user?.vai_tro || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Your account role
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {user?.doanh_nghiep?.ten_doanh_nghiep || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Your organization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/dashboard/storage">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-blue-600 text-sm font-bold">
                  S
                </span>
                Storage Demo
              </CardTitle>
              <CardDescription>
                Test file upload functionality with MinIO/S3 integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Upload images (JPEG, PNG, WebP)</li>
                <li>- Upload documents (PDF, Word, Excel)</li>
                <li>- View uploaded files with public URLs</li>
                <li>- Delete files from storage</li>
              </ul>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/realtime">
          <Card className="hover:border-primary transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded bg-green-100 text-green-600 text-sm font-bold">
                  R
                </span>
                Real-time Demo
              </CardTitle>
              <CardDescription>
                Test WebSocket connection and live notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- Send test notifications</li>
                <li>- View real-time notification feed</li>
                <li>- Monitor WebSocket connection status</li>
                <li>- Test broadcast messages</li>
              </ul>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* API Info */}
      <Card>
        <CardHeader>
          <CardTitle>API Information</CardTitle>
          <CardDescription>
            Backend connection details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">API URL</p>
              <p className="text-sm text-muted-foreground font-mono">
                {process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">WebSocket URL</p>
              <p className="text-sm text-muted-foreground font-mono">
                {process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
