/**
 * Trang đăng nhập - Form xác thực chuyên nghiệp
 * 
 * Features:
 * - Zod validation voi thong bao loi Tieng Viet co dau
 * - React Hook Form integration
 * - Su dung Design System ServiceOS
 * - Xu ly trang thai loading
 * - Xu ly loi
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
// VALIDATION SCHEMA (Thong bao loi Tieng Viet co dau)
// ============================================================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập địa chỉ email")
    .email("Địa chỉ email không hợp lệ"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  tenant_code: z
    .string()
    .optional()
    .transform((val) => val || undefined),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// TRANG ĐĂNG NHẬP
// ============================================================================

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, isLoading, error, isAuthenticated, clearError, isInitialized } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // React Hook Form voi Zod resolver
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

  // Kiem tra da xac thuc chua
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isValid = await initializeAuth();
        if (isValid) {
          router.replace("/dashboard");
        }
      } catch {
        // Chưa xác thực, ở lại trang đăng nhập
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // Chuyen huong neu da xac thuc
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isInitialized, isAuthenticated, router]);

  // Hien thi toast loi
  useEffect(() => {
    if (error) {
      toast({
        title: "Đăng nhập thất bại",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // Xu ly submit form
  const onSubmit = async (data: LoginFormData) => {
    const success = await login({
      email: data.email,
      password: data.password,
      tenant_code: data.tenant_code,
    });

    if (success) {
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn đến với ServiceOS!",
      });
      router.replace("/dashboard");
    }
  };

  // Hien thi loader khi dang kiem tra
  if (isCheckingAuth) {
    return <GlobalLoader message="Đang kiểm tra phiên đăng nhập..." />;
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: "var(--primary-navy)" }}
    >
      {/* Trang tri nen */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: "var(--primary-dark)" }}
        />
        <div 
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full blur-3xl opacity-20"
          style={{ backgroundColor: "var(--primary-blue)" }}
        />
      </div>

      {/* The dang nhap */}
      <Card className="w-full max-w-md relative z-10 bg-[var(--white)]/10 backdrop-blur-xl border-[var(--white)]/20 shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-8">
          {/* Logo */}
          <div 
            className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ 
              backgroundColor: "var(--primary-dark)",
              boxShadow: "0 10px 40px rgba(18, 78, 102, 0.4)"
            }}
          >
            <span className="text-2xl font-bold text-[var(--white)]">S</span>
          </div>

          <CardTitle className="text-2xl font-bold text-[var(--white)]">
            ServiceOS
          </CardTitle>
          <CardDescription className="text-[var(--gray-300)]">
            Đăng nhập vào tài khoản để tiếp tục
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Truong Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[var(--gray-200)]">
                Địa chỉ email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...register("email")}
                disabled={isLoading || isSubmitting}
                className={cn(
                  "bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)]",
                  "focus:border-[var(--primary-blue)] focus:ring-[var(--primary-blue)]",
                  errors.email && "border-[var(--error)] focus:border-[var(--error)]"
                )}
              />
              {errors.email && (
                <p className="text-xs text-[var(--error)]">{errors.email.message}</p>
              )}
            </div>

            {/* Truong Mat khau */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[var(--gray-200)]">
                Mật khẩu
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu của bạn"
                {...register("password")}
                disabled={isLoading || isSubmitting}
                className={cn(
                  "bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)]",
                  "focus:border-[var(--primary-blue)] focus:ring-[var(--primary-blue)]",
                  errors.password && "border-[var(--error)] focus:border-[var(--error)]"
                )}
              />
              {errors.password && (
                <p className="text-xs text-[var(--error)]">{errors.password.message}</p>
              )}
            </div>

            {/* Truong Ma doanh nghiep */}
            <div className="space-y-2">
              <Label htmlFor="tenant_code" className="text-[var(--gray-200)]">
                Mã doanh nghiệp (Tùy chọn)
              </Label>
              <Input
                id="tenant_code"
                type="text"
                placeholder="VD: DEMO"
                {...register("tenant_code")}
                disabled={isLoading || isSubmitting}
                className="bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)] focus:border-[var(--primary-blue)] focus:ring-[var(--primary-blue)]"
              />
              <p className="text-xs text-[var(--gray-400)]">
                Nhập mã doanh nghiệp nếu sử dụng chế độ đa đối tượng
              </p>
            </div>

            {/* Nut Dang nhap */}
            <Button
              type="submit"
              disabled={isLoading || isSubmitting}
              className={cn(
                "w-full h-11 text-base font-medium",
                "transition-all duration-200 shadow-lg"
              )}
              style={{ 
                backgroundColor: "var(--primary-dark)",
                boxShadow: "0 10px 30px rgba(18, 78, 102, 0.3)"
              }}
            >
              {isLoading || isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[var(--white)]/30 border-t-[var(--white)] rounded-full animate-spin" />
                  Dang xu ly...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </Button>
          </form>

          {/* Thông tin tài khoản demo */}
          <div className="mt-8 pt-6 border-t border-[var(--white)]/10 text-center">
            <p className="text-sm text-[var(--gray-400)] mb-2">Tài khoản demo:</p>
            <div className="bg-[var(--white)]/5 rounded-lg p-3 border border-[var(--white)]/10">
              <p className="font-mono text-xs text-[var(--gray-300)]">
                admin@serviceos-demo.vn
              </p>
              <p className="font-mono text-xs text-[var(--gray-300)] mt-1">
                Admin@123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phien ban */}
      <p className="absolute bottom-4 text-xs text-[var(--gray-500)]">
        ServiceOS v1.0 - Nền tảng quản lý dịch vụ doanh nghiệp
      </p>
    </div>
  );
}
