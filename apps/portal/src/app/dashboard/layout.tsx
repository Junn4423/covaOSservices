/**
 * Dashboard Layout - Production Ready
 * 
 * Features:
 * - Auth initialization before render (prevents flash)
 * - Socket connection coordinated with auth
 * - Responsive layout with collapsible sidebar
 * - Error boundary protection
 * - Toast integration for socket events
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useSocketStore, initializeAuth } from "@/stores";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlobalLoader } from "@/components/common";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const { setToastCallback } = useSocketStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ========================================
  // Initialize Auth (CRITICAL - runs first)
  // ========================================
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await initializeAuth();
        if (!isValid) {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // ========================================
  // Setup Toast Callback for Socket Events
  // ========================================
  const handleToast = useCallback(
    (notification: { title: string; description: string; variant: "default" | "destructive" }) => {
      toast({
        title: notification.title,
        description: notification.description,
        variant: notification.variant,
      });
    },
    [toast]
  );

  useEffect(() => {
    setToastCallback(handleToast);
    return () => setToastCallback(null);
  }, [handleToast, setToastCallback]);

  // ========================================
  // Redirect if not authenticated after init
  // ========================================
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  // ========================================
  // Loading State
  // ========================================
  if (isCheckingAuth || !isInitialized) {
    return <GlobalLoader message="Đang xác thực..." />;
  }

  // ========================================
  // Not Authenticated - Redirect handled above
  // ========================================
  if (!isAuthenticated) {
    return <GlobalLoader message="Đang chuyển hướng..." />;
  }

  // ========================================
  // Render Layout
  // ========================================
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main Content */}
        <main className="p-4 lg:p-6">
          {/* Content Container */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-xs text-slate-500">
            ServiceOS v1.0 - Nền tảng quản lý dịch vụ doanh nghiệp
          </p>
        </footer>
      </div>
    </div>
  );
}
