/**
 * Dashboard Home Page
 * Overview with stats and quick access
 */

"use client";

import { useAuthStore } from "@/stores";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULES } from "@/config";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  color: string;
}

function StatCard({ title, value, description, color }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute top-0 left-0 w-1 h-full", color)} />
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl font-bold">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MODULE CARD COMPONENT
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
      <Card className="group h-full hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-lg shadow-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: color }}
            >
              {iconLetter}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {label}
              </h3>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
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
// DASHBOARD PAGE
// ============================================================================

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chao buoi sang";
    if (hour < 18) return "Chao buoi chieu";
    return "Chao buoi toi";
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <p className="text-indigo-200">{getGreeting()},</p>
        <h1 className="text-3xl font-bold mt-1">
          {user?.ho_ten || "Nguoi dung"}
        </h1>
        <p className="text-indigo-100 mt-2">
          Chao mung ban quay tro lai voi ServiceOS
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Cong viec hom nay"
          value="12"
          description="Tang 8% so voi hom qua"
          color="bg-indigo-500"
        />
        <StatCard
          title="Khach hang moi"
          value="24"
          description="Tuan nay"
          color="bg-emerald-500"
        />
        <StatCard
          title="Doanh thu"
          value="45.2M"
          description="Thang nay"
          color="bg-amber-500"
        />
        <StatCard
          title="Nhan vien hoat dong"
          value="18"
          description="Dang truc tuyen"
          color="bg-purple-500"
        />
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Cac module he thong
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Hanh dong nhanh
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/jobs"
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl mb-3">
              +
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tao cong viec
            </span>
          </Link>
          <Link
            href="/dashboard/customers"
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xl mb-3">
              +
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Them khach hang
            </span>
          </Link>
          <Link
            href="/dashboard/quotes"
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl mb-3">
              +
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Tao bao gia
            </span>
          </Link>
          <Link
            href="/dashboard/inventory"
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xl mb-3">
              +
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Nhap kho
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
