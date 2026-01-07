/**
 * Login Page - Professional Authentication Form
 * 
 * Features:
 * - Zod validation with Vietnamese error messages
 * - React Hook Form integration
 * - Premium gradient design
 * - Loading states
 * - Error handling
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore, initializeAuth } from "@/stores";
import { useToast } from "@/hooks/use-toast";
import { GlobalLoader } from "@/components/common";
import { cn } from "@/lib/utils";

// ============================================================================
// VALIDATION SCHEMA (Vietnamese Error Messages)
// ============================================================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui long nhap email")
    .email("Email khong hop le"),
  password: z
    .string()
    .min(1, "Vui long nhap mat khau")
    .min(6, "Mat khau phai co it nhat 6 ky tu"),
  tenant_code: z
    .string()
    .optional()
    .transform((val) => val || undefined),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// LOGIN PAGE COMPONENT
// ============================================================================

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isLoading, error, isAuthenticated, clearError, isInitialized } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      tenant_code: "",
    },
  });

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await initializeAuth();
        if (isValid) {
          router.replace("/dashboard");
        }
      } catch {
        // Not authenticated, stay on login
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // Redirect if becomes authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isInitialized, isAuthenticated, router]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Dang nhap that bai",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // Form submit
  const onSubmit = async (data: LoginFormData) => {
    const success = await login({
      email: data.email,
      password: data.password,
      tenant_code: data.tenant_code,
    });

    if (success) {
      toast({
        title: "Dang nhap thanh cong",
        description: "Chao mung ban den voi ServiceOS!",
      });
      router.replace("/dashboard");
    }
  };

  // Show loader while checking auth
  if (isCheckingAuth) {
    return <GlobalLoader message="Dang kiem tra dang nhap..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-8">
          {/* Logo */}
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <span className="text-2xl font-bold text-white">S</span>
          </div>

          <CardTitle className="text-2xl font-bold text-white">
            ServiceOS
          </CardTitle>
          <CardDescription className="text-slate-300">
            Dang nhap vao tai khoan de tiep tuc
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register("email")}
                disabled={isLoading || isSubmitting}
                className={cn(
                  "bg-white/5 border-white/20 text-white placeholder:text-slate-400",
                  "focus:border-indigo-500 focus:ring-indigo-500",
                  errors.email && "border-red-500 focus:border-red-500"
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">
                Mat khau
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhap mat khau cua ban"
                {...register("password")}
                disabled={isLoading || isSubmitting}
                className={cn(
                  "bg-white/5 border-white/20 text-white placeholder:text-slate-400",
                  "focus:border-indigo-500 focus:ring-indigo-500",
                  errors.password && "border-red-500 focus:border-red-500"
                )}
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Tenant Code Field */}
            <div className="space-y-2">
              <Label htmlFor="tenant_code" className="text-slate-200">
                Ma doanh nghiep (Tu chon)
              </Label>
              <Input
                id="tenant_code"
                type="text"
                placeholder="VD: DEMO"
                {...register("tenant_code")}
                disabled={isLoading || isSubmitting}
                className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-400">
                Nhap ma doanh nghiep neu su dung che do multi-tenant
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className={cn(
                "w-full h-11 text-base font-medium",
                "bg-gradient-to-r from-indigo-500 to-purple-600",
                "hover:from-indigo-600 hover:to-purple-700",
                "transition-all duration-200 shadow-lg shadow-indigo-500/30"
              )}
            >
              {isLoading || isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Dang xu ly...
                </span>
              ) : (
                "Dang nhap"
              )}
            </Button>
          </form>

          {/* Demo Account Info */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400 mb-2">Tai khoan demo:</p>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="font-mono text-xs text-slate-300">
                admin@serviceos-demo.vn
              </p>
              <p className="font-mono text-xs text-slate-300 mt-1">
                Admin@123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version */}
      <p className="absolute bottom-4 text-xs text-slate-500">
        ServiceOS v1.0 - Enterprise Service Management
      </p>
    </div>
  );
}
