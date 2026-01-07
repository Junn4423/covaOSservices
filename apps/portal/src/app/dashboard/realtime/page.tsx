"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useSocketStore } from "@/store";

export default function RealtimeDemoPage() {
  const { toast } = useToast();
  const {
    isConnected,
    connectionError,
    notifications,
    unreadCount,
    sendTestNotification,
    clearNotifications,
    addNotification,
  } = useSocketStore();

  const [testTitle, setTestTitle] = useState("Test Notification");
  const [testMessage, setTestMessage] = useState("This is a test notification from the dashboard.");

  // Send test notification via socket
  const handleSendTest = () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "WebSocket is not connected. Please wait or refresh the page.",
        variant: "destructive",
      });
      return;
    }

    sendTestNotification(testTitle, testMessage);
    toast({
      title: "Test Sent",
      description: "Test notification request sent to server.",
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
      title: "Local Notification Added",
      description: "Added to notification feed (local only)",
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Real-time Demo</h2>
        <p className="text-muted-foreground">
          Test WebSocket connection and live notifications
        </p>
      </div>

      {/* Connection status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
            WebSocket connection to backend server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`h-4 w-4 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="font-medium">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>

            {connectionError && (
              <span className="text-sm text-destructive">
                Error: {connectionError}
              </span>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Socket URL</p>
              <p className="font-mono text-sm mt-1">
                {process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Unread Count</p>
              <p className="text-2xl font-bold mt-1">{unreadCount}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Notifications</p>
              <p className="text-2xl font-bold mt-1">{notifications.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send test notification */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test Notification</CardTitle>
          <CardDescription>
            Send a test notification through the WebSocket server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="Notification title"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Notification message"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleSendTest} disabled={!isConnected}>
              Send via Socket
            </Button>
            <Button onClick={handleAddLocal} variant="outline">
              Add Local (UI Test)
            </Button>
            <Button onClick={clearNotifications} variant="destructive">
              Clear All
            </Button>
          </div>

          {!isConnected && (
            <p className="text-sm text-muted-foreground">
              Note: WebSocket is not connected. The &quot;Send via Socket&quot; button requires
              an active connection. You can still test the UI with &quot;Add Local&quot;.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notification feed */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Feed</CardTitle>
          <CardDescription>
            Real-time notifications received from the server
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Send a test notification or wait for server events
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id || index}
                  className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  {/* Icon based on type */}
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.loaiThongBao?.includes("ALERT")
                        ? "bg-red-100 text-red-600"
                        : notification.loaiThongBao?.includes("BROADCAST")
                        ? "bg-purple-100 text-purple-600"
                        : notification.loaiThongBao?.includes("LOCAL")
                        ? "bg-gray-100 text-gray-600"
                        : "bg-blue-100 text-blue-600"
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
                        {notification.loaiThongBao || "GENERAL"}
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
      <Card>
        <CardHeader>
          <CardTitle>How it Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">1. WebSocket Connection</p>
            <p>
              When you login, the frontend automatically connects to the WebSocket server
              using your JWT token for authentication.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">2. Room-based Notifications</p>
            <p>
              Each user automatically joins their personal room (user:userId) and tenant room
              (tenant:tenantId) for targeted notifications.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">3. Test Notifications</p>
            <p>
              The &quot;Send via Socket&quot; button emits a test:notification event to the server,
              which then sends a notification back to your socket.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">4. Integration</p>
            <p>
              In production, backend services use RealtimeService.notifyUser() to push
              notifications to specific users in real-time.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
