/**
 * Sidebar Component - Professional ServiceOS Navigation
 * 
 * Features:
 * - Collapsible module menu
 * - All 12 modules with Vietnamese labels
 * - Active state tracking
 * - Premium dark theme design
 * - User info section
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import { MODULES, QUICK_ACCESS, type ModuleConfig } from "@/config";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const isModuleActive = (module: ModuleConfig) => {
    return pathname.startsWith(module.href);
  };

  const isSubModuleActive = (href: string) => {
    return pathname === href;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col",
          "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800",
          "border-r border-slate-700/50",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ========================================
            Logo Header
            ======================================== */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-700/50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">ServiceOS</h1>
            <p className="text-xs text-slate-400">Nền tảng quản lý dịch vụ doanh nghiệp</p>
          </div>
        </div>

        {/* ========================================
            Quick Access Links
            ======================================== */}
        <div className="px-4 py-4 border-b border-slate-700/50">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 px-2">
            Truy cập nhanh
          </p>
          <nav className="space-y-1">
            {QUICK_ACCESS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                      isActive
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-700 text-slate-300"
                    )}
                  >
                    {item.iconLetter}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ========================================
            Module Navigation (12 Modules)
            ======================================== */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 px-2">
            Cac module
          </p>
          <nav className="space-y-1">
            {MODULES.map((module) => {
              const isActive = isModuleActive(module);
              const isExpanded = expandedModules.includes(module.id) || isActive;
              const hasSubModules = module.subModules && module.subModules.length > 0;

              return (
                <div key={module.id}>
                  {/* Module Item */}
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                    )}
                    onClick={() => hasSubModules && toggleModule(module.id)}
                  >
                    <Link
                      href={module.href}
                      onClick={(e) => {
                        if (hasSubModules) {
                          e.preventDefault();
                        }
                        onClose?.();
                      }}
                      className="flex items-center gap-3 flex-1"
                    >
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: module.color }}
                      >
                        {module.iconLetter}
                      </span>
                      <span className="truncate">{module.label}</span>
                    </Link>
                    {hasSubModules && (
                      <span
                        className={cn(
                          "text-slate-400 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      >
                        {">"}
                      </span>
                    )}
                  </div>

                  {/* Sub Modules */}
                  {hasSubModules && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-4">
                      {module.subModules!.map((sub) => (
                        <Link
                          key={sub.id}
                          href={sub.href}
                          onClick={onClose}
                          className={cn(
                            "block px-3 py-1.5 rounded-lg text-sm transition-all",
                            isSubModuleActive(sub.href)
                              ? "bg-indigo-500/20 text-indigo-400"
                              : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                          )}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* ========================================
            User Section
            ======================================== */}
        <div className="border-t border-slate-700/50 p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm">
              {user?.ho_ten
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.ho_ten || "Nguoi dung"}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
              "text-slate-300 hover:text-white",
              "bg-slate-800 hover:bg-slate-700",
              "border border-slate-700 hover:border-slate-600",
              "transition-all"
            )}
          >
            Dang xuat
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
