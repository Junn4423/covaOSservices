/**
 * Header Component - ServiceOS Dashboard Header
 * Su dung Design System mau sac moi
 * 
 * Features:
 * - Hien thi trang thai Socket (Xanh/Do)
 * - Dropdown thong bao
 * - Avatar nguoi dung
 * - Nut menu mobile
 * - Tieu de trang
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

  // Lay tieu de trang tu route
  const getPageTitle = () => {
    // Kiem tra modules
    const module = getModuleByHref(pathname);
    if (module) return module.label;

    // Kiem tra quick access
    const quickAccess = QUICK_ACCESS.find((q) => pathname === q.href);
    if (quickAccess) return quickAccess.label;

    return "Tong quan";
  };

  // Chu cai dau cua ten nguoi dung
  const userInitials =
    user?.ho_ten
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  // Dong dropdown khi click ra ngoai
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
    <header 
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 lg:px-8"
      style={{ 
        backgroundColor: "var(--white)",
        borderColor: "var(--gray-200)"
      }}
    >
      {/* Phan ben trai */}
      <div className="flex items-center gap-4">
        {/* Nut Menu Mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg transition-colors"
          style={{ backgroundColor: "transparent" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--gray-100)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <span className="sr-only">Mo menu</span>
          <div className="space-y-1.5">
            <div className="h-0.5 w-6" style={{ backgroundColor: "var(--gray-600)" }} />
            <div className="h-0.5 w-6" style={{ backgroundColor: "var(--gray-600)" }} />
            <div className="h-0.5 w-6" style={{ backgroundColor: "var(--gray-600)" }} />
          </div>
        </button>

        {/* Tieu de trang */}
        <div>
          <h1 
            className="text-lg font-semibold"
            style={{ color: "var(--gray-900)" }}
          >
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Phan ben phai */}
      <div className="flex items-center gap-4">
        {/* Trang thai Socket */}
        <SocketStatusIndicator showLabel />

        {/* Thong bao */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 p-0 rounded-lg"
            style={{ backgroundColor: "transparent" }}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span 
              className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-medium"
              style={{ backgroundColor: "var(--gray-100)", color: "var(--gray-600)" }}
            >
              TB
            </span>
            {unreadCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-[var(--white)]"
                style={{ backgroundColor: "var(--error)" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* Dropdown Thong bao */}
          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 rounded-xl border shadow-xl z-50"
              style={{ 
                backgroundColor: "var(--white)",
                borderColor: "var(--gray-200)"
              }}
            >
              <div 
                className="border-b p-4"
                style={{ borderColor: "var(--gray-200)" }}
              >
                <h3 
                  className="font-semibold"
                  style={{ color: "var(--gray-900)" }}
                >
                  Thong bao
                </h3>
                <p 
                  className="text-xs"
                  style={{ color: "var(--gray-500)" }}
                >
                  Ban co {unreadCount} thong bao chua doc
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p 
                    className="p-6 text-sm text-center"
                    style={{ color: "var(--gray-500)" }}
                  >
                    Khong co thong bao nao
                  </p>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "border-b p-4 transition-colors cursor-pointer",
                        !("read" in notification && notification.read) &&
                        "bg-[var(--primary-blue)]/5"
                      )}
                      style={{ 
                        borderColor: "var(--gray-100)"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--gray-50)"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !("read" in notification && notification.read) ? "rgba(28, 110, 140, 0.05)" : "transparent"}
                    >
                      <p 
                        className="text-sm font-medium"
                        style={{ color: "var(--gray-900)" }}
                      >
                        {notification.tieuDe}
                      </p>
                      <p 
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: "var(--gray-500)" }}
                      >
                        {notification.noiDung}
                      </p>
                    </div>
                  ))
                )}
              </div>
              <div 
                className="border-t p-2"
                style={{ borderColor: "var(--gray-200)" }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  style={{ color: "var(--primary-blue)" }}
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

        {/* Avatar nguoi dung */}
        <Avatar 
          className="h-9 w-9 border-2"
          style={{ borderColor: "var(--gray-200)" }}
        >
          <AvatarImage src={user?.anh_dai_dien || ""} alt={user?.ho_ten || ""} />
          <AvatarFallback 
            className="text-[var(--white)] text-sm font-medium"
            style={{ backgroundColor: "var(--primary-dark)" }}
          >
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

export default Header;
