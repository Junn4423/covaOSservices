"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore, useSocketStore } from "@/store";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { isConnected, unreadCount, notifications } = useSocketStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const userInitials = user?.ho_ten
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white dark:bg-gray-800 px-4 lg:px-8">
      {/* Mobile menu button */}
      <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
        <span className="sr-only">Open menu</span>
        <div className="space-y-1.5">
          <div className="h-0.5 w-6 bg-gray-600 dark:bg-gray-300"></div>
          <div className="h-0.5 w-6 bg-gray-600 dark:bg-gray-300"></div>
          <div className="h-0.5 w-6 bg-gray-600 dark:bg-gray-300"></div>
        </div>
      </button>

      {/* Page title */}
      <h1 className="text-lg font-semibold hidden lg:block">Dashboard</h1>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="text-lg">N</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-white dark:bg-gray-800 shadow-lg">
              <div className="border-b p-3">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">
                    No notifications yet
                  </p>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className="border-b p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <p className="text-sm font-medium">{notification.tieuDe}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.noiDung}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowNotifications(false);
                    router.push("/dashboard/realtime");
                  }}
                >
                  View All
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.anh_dai_dien || ""} alt={user?.ho_ten || ""} />
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
