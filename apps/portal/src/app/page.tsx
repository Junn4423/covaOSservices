/**
 * Root Page - Redirect Logic
 * 
 * If authenticated: Redirect to Dashboard
 * If not authenticated: Redirect to Login
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, initializeAuth } from "@/stores";
import { GlobalLoader } from "@/components/common";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();

  useEffect(() => {
    const checkAndRedirect = async () => {
      // Initialize auth to check if user is logged in
      const isValid = await initializeAuth();

      if (isValid) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    checkAndRedirect();
  }, [router]);

  // Show loader while checking auth
  return <GlobalLoader message="Dang kiem tra dang nhap..." />;
}
