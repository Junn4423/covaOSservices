/**
 * Trang Dang ky - Form dang ky Tenant moi
 * 
 * Features:
 * - Zod validation voi thong bao loi Tieng Viet
 * - React Hook Form integration
 * - Su dung Design System ServiceOS
 * - Dang ky doanh nghiep moi voi cac thong tin can thiet
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import httpClient from "@/lib/http";

// ============================================================================
// VALIDATION SCHEMA (Thong bao loi Tieng Viet)
// ============================================================================

const registerSchema = z.object({
  ten_doanh_nghiep: z
    .string()
    .min(1, "Vui long nhap ten doanh nghiep")
    .min(3, "Ten doanh nghiep phai co it nhat 3 ky tu"),
  ma_doanh_nghiep: z
    .string()
    .min(1, "Vui long nhap ma doanh nghiep")
    .min(2, "Ma doanh nghiep phai co it nhat 2 ky tu")
    .max(20, "Ma doanh nghiep toi da 20 ky tu")
    .regex(/^[A-Z0-9_]+$/, "Ma doanh nghiep chi chua chu in hoa, so va dau gach duoi"),
  email_admin: z
    .string()
    .min(1, "Vui long nhap email quan tri vien")
    .email("Dia chi email khong hop le"),
  ho_ten_admin: z
    .string()
    .min(1, "Vui long nhap ho ten quan tri vien")
    .min(2, "Ho ten phai co it nhat 2 ky tu"),
  so_dien_thoai: z
    .string()
    .min(1, "Vui long nhap so dien thoai")
    .regex(/^[0-9]{10,11}$/, "So dien thoai phai co 10-11 chu so"),
  mat_khau: z
    .string()
    .min(1, "Vui long nhap mat khau")
    .min(8, "Mat khau phai co it nhat 8 ky tu")
    .regex(/[A-Z]/, "Mat khau phai chua it nhat 1 chu in hoa")
    .regex(/[0-9]/, "Mat khau phai chua it nhat 1 chu so"),
  xac_nhan_mat_khau: z
    .string()
    .min(1, "Vui long xac nhan mat khau"),
  goi_cuoc: z
    .enum(["STARTER", "PROFESSIONAL", "ENTERPRISE"], {
      errorMap: () => ({ message: "Vui long chon goi cuoc" }),
    }),
}).refine((data) => data.mat_khau === data.xac_nhan_mat_khau, {
  message: "Mat khau xac nhan khong khop",
  path: ["xac_nhan_mat_khau"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// ============================================================================
// CAC GOI CUOC
// ============================================================================

const SUBSCRIPTION_PLANS = [
  {
    id: "STARTER",
    name: "Goi Khoi nghiep",
    price: "Mien phi",
    features: ["5 nguoi dung", "1GB luu tru", "Ho tro email"],
  },
  {
    id: "PROFESSIONAL",
    name: "Goi Chuyen nghiep",
    price: "1.990.000 VND/thang",
    features: ["25 nguoi dung", "10GB luu tru", "Ho tro 24/7", "Bao cao nang cao"],
  },
  {
    id: "ENTERPRISE",
    name: "Goi Doanh nghiep",
    price: "Lien he",
    features: ["Khong gioi han nguoi dung", "Luu tru khong gioi han", "Ho tro chuyen gia", "Tuy chinh theo yeu cau"],
  },
];

// ============================================================================
// TRANG DANG KY
// ============================================================================

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("STARTER");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ten_doanh_nghiep: "",
      ma_doanh_nghiep: "",
      email_admin: "",
      ho_ten_admin: "",
      so_dien_thoai: "",
      mat_khau: "",
      xac_nhan_mat_khau: "",
      goi_cuoc: "STARTER",
    },
  });

  // Xu ly submit form
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      await httpClient.post("/auth/register-tenant", {
        ten_doanh_nghiep: data.ten_doanh_nghiep,
        ma_doanh_nghiep: data.ma_doanh_nghiep,
        email_admin: data.email_admin,
        ho_ten_admin: data.ho_ten_admin,
        so_dien_thoai: data.so_dien_thoai,
        mat_khau: data.mat_khau,
        goi_cuoc: data.goi_cuoc,
      });

      toast({
        title: "Đăng ký thành công",
        description: "Tài khoản doanh nghiệp đã được tạo. Vui lòng đăng nhập.",
      });

      router.push("/login");
    } catch (error: unknown) {
      const errorMessage = 
        (error as { message?: string })?.message || 
        "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.";
      
      toast({
        title: "Đăng ký thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xu ly chon goi cuoc
  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    setValue("goi_cuoc", planId as "STARTER" | "PROFESSIONAL" | "ENTERPRISE");
  };

  return (
    <div 
      className="min-h-screen py-8 px-4"
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

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ 
              backgroundColor: "var(--primary-dark)",
              boxShadow: "0 10px 40px rgba(18, 78, 102, 0.4)"
            }}
          >
            <span className="text-2xl font-bold text-[var(--white)]">S</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--white)] mb-2">
            Đăng ký ServiceOS
          </h1>
          <p className="text-[var(--gray-300)]">
            Tạo tài khoản doanh nghiệp mới để bắt đầu sử dụng
          </p>
        </div>

        {/* Form Card */}
        <Card className="bg-[var(--white)]/10 backdrop-blur-xl border-[var(--white)]/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-[var(--white)]">Thông tin đăng ký</CardTitle>
            <CardDescription className="text-[var(--gray-300)]">
              Điền đầy đủ thông tin để tạo tài khoản doanh nghiệp
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Thong tin doanh nghiep */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--gray-200)] uppercase tracking-wider">
                  Thông tin doanh nghiệp
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ten_doanh_nghiep" className="text-[var(--gray-200)]">
                      Tên doanh nghiệp
                    </Label>
                    <Input
                      id="ten_doanh_nghiep"
                      placeholder="Công ty TNHH ABC"
                      {...register("ten_doanh_nghiep")}
                      disabled={isSubmitting}
                      className={cn(
                        "bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)]",
                        errors.ten_doanh_nghiep && "border-[var(--error)]"
                      )}
                    />
                    {errors.ten_doanh_nghiep && (
                      <p className="text-xs text-[var(--error)]">{errors.ten_doanh_nghiep.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ma_doanh_nghiep" className="text-[var(--gray-200)]">
                      Mã doanh nghiệp
                    </Label>
                    <Input
                      id="ma_doanh_nghiep"
                      placeholder="CONG_TY_ABC"
                      {...register("ma_doanh_nghiep")}
                      disabled={isSubmitting}
                      className={cn(
                        "bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)] uppercase",
                        errors.ma_doanh_nghiep && "border-[var(--error)]"
                      )}
                    />
                    {errors.ma_doanh_nghiep && (
                      <p className="text-xs text-[var(--error)]">{errors.ma_doanh_nghiep.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Thong tin quan tri vien */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--gray-200)] uppercase tracking-wider">
                  Thông tin quản trị viên
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ho_ten_admin" className="text-[var(--gray-200)]">
                      Họ và tên
                    </Label>
                    <Input
                      id="ho_ten_admin"
                      placeholder="Nguyen Van A"
                      {...register("ho_ten_admin")}
                      disabled={isSubmitting}
                      className={cn(
                        "bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)]",
                        errors.ho_ten_admin && "border-[var(--error)]"
                      )}
                    />
                    {errors.ho_ten_admin && (
                      <p className="text-xs text-[var(--error)]">{errors.ho_ten_admin.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_admin" className="text-[var(--gray-200)]">
                      Email
                    </Label>
                    <Input
                      id="email_admin"
                      type="email"
                      placeholder="admin@congty.vn"
                      {...register("email_admin")}
                      disabled={isSubmitting}
                      className={cn(
                        "bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)]",
                        errors.email_admin && "border-[var(--error)]"
                      )}
                    />
                    {errors.email_admin && (
                      <p className="text-xs text-[var(--error)]">{errors.email_admin.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="so_dien_thoai" className="text-[var(--gray-200)]">
                      Số điện thoại
                    </Label>
                    <Input
                      id="so_dien_thoai"
                      placeholder="0901234567"
                      {...register("so_dien_thoai")}
                      disabled={isSubmitting}
                      className={cn(
                        "bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)]",
                        errors.so_dien_thoai && "border-[var(--error)]"
                      )}
                    />
                    {errors.so_dien_thoai && (
                      <p className="text-xs text-[var(--error)]">{errors.so_dien_thoai.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mat_khau" className="text-[var(--gray-200)]">
                      Mật khẩu
                    </Label>
                    <Input
                      id="mat_khau"
                      type="password"
                      placeholder="Nhập mật khẩu"
                      {...register("mat_khau")}
                      disabled={isSubmitting}
                      className={cn(
                        "bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)]",
                        errors.mat_khau && "border-[var(--error)]"
                      )}
                    />
                    {errors.mat_khau && (
                      <p className="text-xs text-[var(--error)]">{errors.mat_khau.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="xac_nhan_mat_khau" className="text-[var(--gray-200)]">
                      Xác nhận mật khẩu
                    </Label>
                    <Input
                      id="xac_nhan_mat_khau"
                      type="password"
                      placeholder="Nhập lại mật khẩu"
                      {...register("xac_nhan_mat_khau")}
                      disabled={isSubmitting}
                      className={cn(
                        "bg-[var(--white)]/5 border-[var(--white)]/20 text-[var(--white)] placeholder:text-[var(--gray-400)]",
                        errors.xac_nhan_mat_khau && "border-[var(--error)]"
                      )}
                    />
                    {errors.xac_nhan_mat_khau && (
                      <p className="text-xs text-[var(--error)]">{errors.xac_nhan_mat_khau.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Chon goi cuoc */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-[var(--gray-200)] uppercase tracking-wider">
                  Chọn gói cước
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => handlePlanSelect(plan.id)}
                      className={cn(
                        "p-4 rounded-lg border-2 cursor-pointer transition-all",
                        selectedPlan === plan.id
                          ? "border-[var(--primary-blue)] bg-[var(--primary-blue)]/10"
                          : "border-[var(--white)]/20 bg-[var(--white)]/5 hover:border-[var(--white)]/40"
                      )}
                    >
                      <h4 className="font-semibold text-[var(--white)] mb-1">{plan.name}</h4>
                      <p className="text-sm text-[var(--accent-green)] font-medium mb-3">{plan.price}</p>
                      <ul className="space-y-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="text-xs text-[var(--gray-300)]">
                            - {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {errors.goi_cuoc && (
                  <p className="text-xs text-[var(--error)]">{errors.goi_cuoc.message}</p>
                )}
              </div>

              {/* Nut submit */}
              <div className="flex flex-col gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-medium"
                  style={{ 
                    backgroundColor: "var(--primary-dark)",
                    boxShadow: "0 10px 30px rgba(18, 78, 102, 0.3)"
                  }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[var(--white)]/30 border-t-[var(--white)] rounded-full animate-spin" />
                      Dang xu ly...
                    </span>
                  ) : (
                    "Đăng ký ngay"
                  )}
                </Button>

                <p className="text-center text-sm text-[var(--gray-400)]">
                  Đã có tài khoản?{" "}
                  <Link 
                    href="/login" 
                    className="text-[var(--primary-light)] hover:text-[var(--white)] font-medium"
                  >
                    Đăng nhập
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Phien ban */}
        <p className="text-center mt-8 text-xs text-[var(--gray-500)]">
          ServiceOS v1.0 - Nền tảng quản lý dịch vụ doanh nghiệp
        </p>
      </div>
    </div>
  );
}
