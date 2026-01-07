/**
 * Header Component - ServiceOS Dashboard Header
 * 
 * Features:
 * - Socket status indicator
 * - Notifications dropdown
 * - User avatar
 * - Mobile menu toggle
 * - Page title
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore, useSocketStore } from "@/stores";
import { SocketStatusIndicator } from "@/components/common";
import { getModuleByHref, QUICK_ACCESS } from "@/config";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { notifications, unreadCount } = useSocketStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Get page title from route
  const getPageTitle = () => {
    // Check modules
    const module = getModuleByHref(pathname);
    if (module) return module.label;

    // Check quick access
    const quickAccess = QUICK_ACCESS.find((q) => pathname === q.href);
    if (quickAccess) return quickAccess.label;

    return "Tong quan";
  };

  // User initials
  const userInitials =
    user?.ho_ten
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 lg:px-8">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="sr-only">Mo menu</span>
          <div className="space-y-1.5">
            <div className="h-0.5 w-6 bg-slate-600 dark:bg-slate-300" />
            <div className="h-0.5 w-6 bg-slate-600 dark:bg-slate-300" />
            <div className="h-0.5 w-6 bg-slate-600 dark:bg-slate-300" />
          </div>
        </button>

        {/* Page Title */}
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Socket Status */}
        <SocketStatusIndicator showLabel />

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
              TB
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50">
              <div className="border-b border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Thong bao
                </h3>
                <p className="text-xs text-slate-500">
                  Ban co {unreadCount} thong bao chua doc
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500 text-center">
                    Khong co thong bao nao
                  </p>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "border-b border-slate-100 dark:border-slate-800 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer",
                        !("read" in notification && notification.read) &&
                        "bg-indigo-50/50 dark:bg-indigo-900/20"
                      )}
                    >
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {notification.tieuDe}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {notification.noiDung}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                  onClick={() => {
                    setShowNotifications(false);
                    router.push("/dashboard/notifications");
                  }}
                >
                  Xem tat ca thong bao
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <Avatar className="h-9 w-9 border-2 border-slate-200 dark:border-slate-700">
          <AvatarImage src={user?.anh_dai_dien || ""} alt={user?.ho_ten || ""} />
          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-medium">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

export default Header;
