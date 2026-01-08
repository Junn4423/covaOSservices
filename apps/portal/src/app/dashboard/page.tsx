/**
 * Trang Dashboard - Tong quan
 * Su dung Design System ServiceOS
 */

"use client";

import { useAuthStore } from "@/stores";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/config";
import Link from "next/link";

// ============================================================================
// THE THONG KE
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  colorVar: string;
}

function StatCard({ title, value, description, colorVar }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div 
        className="absolute top-0 left-0 w-1 h-full"
        style={{ backgroundColor: colorVar }}
      />
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-bold">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs" style={{ color: "var(--gray-500)" }}>{description}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// THE MODULE
// ============================================================================

interface ModuleCardProps {
  href: string;
  iconLetter: string;
  label: string;
  description: string;
  color: string;
}

function ModuleCard({ href, iconLetter, label, description, color }: ModuleCardProps) {
  return (
    <Link href={href}>
      <Card className="group h-full hover:shadow-lg transition-all cursor-pointer border-[var(--gray-200)] hover:border-[var(--primary-blue)]">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--white)] font-bold text-lg shadow-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: color }}
            >
              {iconLetter}
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold group-hover:text-[var(--primary-blue)] transition-colors"
                style={{ color: "var(--gray-900)" }}
              >
                {label}
              </h3>
              <p 
                className="text-sm mt-1 line-clamp-2"
                style={{ color: "var(--gray-500)" }}
              >
                {description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// TRANG DASHBOARD
// ============================================================================

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Lay loi chao theo thoi gian
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  return (
    <div className="space-y-8">
      {/* Phan chao mung */}
      <div 
        className="rounded-2xl p-8 text-[var(--white)]"
        style={{ 
          background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-blue) 100%)"
        }}
      >
        <p style={{ color: "var(--primary-light)" }}>{getGreeting()},</p>
        <h1 className="text-3xl font-bold mt-1">
          {user?.ho_ten || "Nguoi dung"}
        </h1>
        <p style={{ color: "var(--primary-light)" }} className="mt-2">
          Chào mừng bạn quay trở lại với ServiceOS
        </p>
      </div>

      {/* Luoi thong ke */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Công việc hôm nay"
          value="12"
          description="Tăng 8% so với hôm qua"
          colorVar="var(--primary-dark)"
        />
        <StatCard
          title="Khách hàng mới"
          value="24"
          description="Tuần này"
          colorVar="var(--primary-green)"
        />
        <StatCard
          title="Doanh thu"
          value="45.2M"
          description="Tháng này"
          colorVar="var(--warning)"
        />
        <StatCard
          title="Nhân viên hoạt động"
          value="18"
          description="Đang trực tuyến"
          colorVar="var(--primary-blue)"
        />
      </div>

      {/* Luoi Module */}
      <div>
        <h2 
          className="text-xl font-bold mb-4"
          style={{ color: "var(--gray-900)" }}
        >
          Các phân hệ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((module) => (
            <ModuleCard
              key={module.id}
              href={module.href}
              iconLetter={module.iconLetter}
              label={module.label}
              description={module.description}
              color={module.color}
            />
          ))}
        </div>
      </div>

      {/* Hanh dong nhanh */}
      <div>
        <h2 
          className="text-xl font-bold mb-4"
          style={{ color: "var(--gray-900)" }}
        >
          Hành động nhanh
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/jobs"
            className="flex flex-col items-center justify-center p-6 rounded-xl border transition-colors"
            style={{ 
              backgroundColor: "var(--white)",
              borderColor: "var(--gray-200)"
            }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl mb-3"
              style={{ 
                backgroundColor: "rgba(18, 78, 102, 0.1)",
                color: "var(--primary-dark)"
              }}
            >
              +
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color: "var(--gray-700)" }}
            >
              Tạo công việc
            </span>
          </Link>
          <Link
            href="/dashboard/customers"
            className="flex flex-col items-center justify-center p-6 rounded-xl border transition-colors"
            style={{ 
              backgroundColor: "var(--white)",
              borderColor: "var(--gray-200)"
            }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl mb-3"
              style={{ 
                backgroundColor: "rgba(46, 139, 87, 0.1)",
                color: "var(--primary-green)"
              }}
            >
              +
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color: "var(--gray-700)" }}
            >
              Thêm khách hàng
            </span>
          </Link>
          <Link
            href="/dashboard/quotes"
            className="flex flex-col items-center justify-center p-6 rounded-xl border transition-colors"
            style={{ 
              backgroundColor: "var(--white)",
              borderColor: "var(--gray-200)"
            }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl mb-3"
              style={{ 
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                color: "var(--warning)"
              }}
            >
              +
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color: "var(--gray-700)" }}
            >
              Tạo báo giá
            </span>
          </Link>
          <Link
            href="/dashboard/inventory"
            className="flex flex-col items-center justify-center p-6 rounded-xl border transition-colors"
            style={{ 
              backgroundColor: "var(--white)",
              borderColor: "var(--gray-200)"
            }}
          >
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl mb-3"
              style={{ 
                backgroundColor: "rgba(28, 110, 140, 0.1)",
                color: "var(--primary-blue)"
              }}
            >
              +
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color: "var(--gray-700)" }}
            >
              Nhập kho
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
