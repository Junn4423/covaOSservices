/**
 * Sidebar Component - ServiceOS Navigation
 * Su dung Design System mau sac moi
 * 
 * Features:
 * - Menu co the dong mo (collapsible)
 * - 12 Module voi nhan Tieng Viet
 * - Trang thai active tracking
 * - Theme toi (dark theme) voi mau --primary-navy
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
      {/* Overlay cho mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[var(--black)]/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col",
          "sidebar-nav",
          "border-r border-[var(--gray-700)]/50",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ========================================
            Logo Header
            ======================================== */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-[var(--gray-700)]/50">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
            style={{ backgroundColor: "var(--primary-dark)" }}
          >
            <span className="text-lg font-bold text-[var(--white)]">S</span>
          </div>
          <div>
            <h1 className="font-bold text-[var(--white)] text-lg">ServiceOS</h1>
            <p className="text-xs text-[var(--gray-400)]">Nen tang quan ly dich vu</p>
          </div>
        </div>

        {/* ========================================
            Truy cap nhanh
            ======================================== */}
        <div className="px-4 py-4 border-b border-[var(--gray-700)]/50">
          <p className="text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider mb-3 px-2">
            Truy cap nhanh
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
                      ? "bg-[var(--primary-blue)]/20 text-[var(--primary-light)]"
                      : "sidebar-nav-item"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold",
                      isActive
                        ? "bg-[var(--primary-blue)] text-[var(--white)]"
                        : "bg-[var(--gray-700)] text-[var(--gray-300)]"
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
            Danh sach Module (12 Module)
            ======================================== */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider mb-3 px-2">
            Cac phan he
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
                        ? "bg-[var(--primary-blue)] text-[var(--white)]"
                        : "sidebar-nav-item"
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
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-[var(--white)]"
                        style={{ backgroundColor: module.color }}
                      >
                        {module.iconLetter}
                      </span>
                      <span className="truncate">{module.label}</span>
                    </Link>
                    {hasSubModules && (
                      <span
                        className={cn(
                          "text-[var(--gray-400)] transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      >
                        {">"}
                      </span>
                    )}
                  </div>

                  {/* Sub Modules */}
                  {hasSubModules && isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-[var(--gray-700)] pl-4">
                      {module.subModules!.map((sub) => (
                        <Link
                          key={sub.id}
                          href={sub.href}
                          onClick={onClose}
                          className={cn(
                            "block px-3 py-1.5 rounded-lg text-sm transition-all",
                            isSubModuleActive(sub.href)
                              ? "bg-[var(--primary-blue)]/20 text-[var(--primary-light)]"
                              : "text-[var(--gray-400)] hover:bg-[var(--gray-800)]/50 hover:text-[var(--white)]"
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
            Thong tin nguoi dung
            ======================================== */}
        <div className="border-t border-[var(--gray-700)]/50 p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--gray-800)]/50 mb-3">
            <div 
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--white)] font-bold text-sm"
              style={{ backgroundColor: "var(--primary-dark)" }}
            >
              {user?.ho_ten
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--white)] truncate">
                {user?.ho_ten || "Nguoi dung"}
              </p>
              <p className="text-xs text-[var(--gray-400)] truncate">{user?.email}</p>
            </div>
          </div>

          {/* Nut Dang xuat */}
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
              "text-[var(--gray-300)] hover:text-[var(--white)]",
              "bg-[var(--gray-800)] hover:bg-[var(--gray-700)]",
              "border border-[var(--gray-700)] hover:border-[var(--gray-600)]",
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
