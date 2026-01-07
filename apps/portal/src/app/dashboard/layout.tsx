"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useSocketStore } from "@/store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, accessToken, checkAuth } = useAuthStore();
  const { connect, isConnected } = useSocketStore();

  // Check authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (!isAuthenticated) {
        const isValid = await checkAuth();
        if (!isValid) {
          router.push("/login");
        }
      }
    };
    verifyAuth();
  }, [isAuthenticated, checkAuth, router]);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken && !isConnected) {
      connect(accessToken);
    }
  }, [isAuthenticated, accessToken, isConnected, connect]);

  // Show nothing while checking auth
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
