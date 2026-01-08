/**
 * Dashboard Layout - Production Ready
 * Su dung Design System ServiceOS
 * 
 * Features:
 * - Khoi tao Auth truoc khi render (tranh flash)
 * - Ket noi Socket dong bo voi Auth
 * - Layout responsive voi sidebar co the dong mo
 * - Bao ve bang Error boundary
 * - Tich hop Toast cho cac su kien socket
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useSocketStore, initializeAuth } from "@/stores";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GlobalLoader } from "@/components/common";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { setToastCallback } = useSocketStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // ========================================
  // Khoi tao Auth (QUAN TRONG - chay truoc)
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
  // Thiet lap Toast Callback cho Socket Events
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
  // Chuyen huong neu chua xac thuc sau khi init
  // ========================================
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitialized, isAuthenticated, router]);

  // ========================================
  // Trang thai Loading
  // ========================================
  if (isCheckingAuth || !isInitialized) {
    return <GlobalLoader message="Dang xac thuc..." />;
  }

  // ========================================
  // Chua xac thuc - Chuyen huong xu ly o tren
  // ========================================
  if (!isAuthenticated) {
    return <GlobalLoader message="Dang chuyen huong..." />;
  }

  // ========================================
  // Render Layout
  // ========================================
  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: "var(--gray-100)" }}
    >
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Vung noi dung chinh */}
      <div className="lg:pl-72">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Noi dung chinh */}
        <main className="p-4 lg:p-6">
          {/* Container noi dung */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer 
          className="border-t p-4 text-center"
          style={{ borderColor: "var(--gray-200)" }}
        >
          <p className="text-xs" style={{ color: "var(--gray-500)" }}>
            ServiceOS v1.0 - Nền tảng quản lý dịch vụ doanh nghiệp
          </p>
        </footer>
      </div>
    </div>
  );
}
