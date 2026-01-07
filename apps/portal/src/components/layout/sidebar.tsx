"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";

interface NavItem {
  title: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "D" },
  { title: "Storage Demo", href: "/dashboard/storage", icon: "S" },
  { title: "Real-time Demo", href: "/dashboard/realtime", icon: "R" },
  { title: "Profile", href: "/dashboard/profile", icon: "P" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-white dark:bg-gray-800 lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            S
          </div>
          <span className="font-semibold text-lg">ServiceOS</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-gray-200 dark:bg-gray-600 text-xs font-bold">
                {item.icon}
              </span>
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User info & Logout */}
      <div className="border-t p-4">
        <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
          <p className="text-sm font-medium truncate">{user?.ho_ten || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Role: {user?.vai_tro || "N/A"}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
