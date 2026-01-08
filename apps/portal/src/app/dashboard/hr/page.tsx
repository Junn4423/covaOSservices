/**
 * HR - Trang Quan ly Nhan su & Ca lam viec
 * Module ShiftSquad - ServiceOS
 * 
 * Features:
 * - Quan ly nhan vien
 * - Ca lam viec
 * - Cham cong
 * - Bang luong
 */

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import httpClient, { type PaginatedResponse } from "@/lib/http";
import { DataTable, type DataTablePagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface CaLamViec {
    id: string;
    ten_ca: string;
    gio_bat_dau: string;
    gio_ket_thuc: string;
    mo_ta?: string;
    trang_thai: number;
    ngay_tao: string;
}

interface ChamCong {
    id: string;
    nguoi_dung: {
        ho_ten: string;
        email: string;
    };
    ca_lam_viec?: {
        ten_ca: string;
    };
    gio_vao?: string;
    gio_ra?: string;
    trang_thai: number;
    ghi_chu?: string;
    ngay_lam: string;
}

// ============================================================================
// DINH NGHIA COT - CA LAM VIEC
// ============================================================================

const shiftColumns: ColumnDef<CaLamViec>[] = [
    {
        accessorKey: "ten_ca",
        header: "Tên ca",
        cell: ({ row }) => (
            <span className="font-medium text-gray-900">{row.original.ten_ca}</span>
        ),
    },
    {
        accessorKey: "gio_bat_dau",
        header: "Giờ bắt đầu",
        cell: ({ row }) => (
            <span className="text-gray-700 font-mono">{row.original.gio_bat_dau || "---"}</span>
        ),
    },
    {
        accessorKey: "gio_ket_thuc",
        header: "Giờ kết thúc",
        cell: ({ row }) => (
            <span className="text-gray-700 font-mono">{row.original.gio_ket_thuc || "---"}</span>
        ),
    },
    {
        accessorKey: "mo_ta",
        header: "Mô tả",
        cell: ({ row }) => (
            <span className="text-gray-500 text-sm">{row.original.mo_ta || "---"}</span>
        ),
    },
    {
        accessorKey: "trang_thai",
        header: "Trạng thái",
        cell: ({ row }) => (
            <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                row.original.trang_thai === 1
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
            )}>
                {row.original.trang_thai === 1 ? "Hoạt động" : "Ngừng"}
            </span>
        ),
    },
];

// ============================================================================
// DINH NGHIA COT - CHAM CONG
// ============================================================================

const attendanceColumns: ColumnDef<ChamCong>[] = [
    {
        accessorKey: "nguoi_dung",
        header: "Nhân viên",
        cell: ({ row }) => (
            <div>
                <p className="font-medium text-gray-900">{row.original.nguoi_dung?.ho_ten || "---"}</p>
                <p className="text-xs text-gray-500">{row.original.nguoi_dung?.email}</p>
            </div>
        ),
    },
    {
        accessorKey: "ngay_lam",
        header: "Ngày làm",
        cell: ({ row }) => (
            <span className="text-gray-700">
                {row.original.ngay_lam ? new Date(row.original.ngay_lam).toLocaleDateString("vi-VN") : "---"}
            </span>
        ),
    },
    {
        accessorKey: "ca_lam_viec",
        header: "Ca làm",
        cell: ({ row }) => (
            <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-xs">
                {row.original.ca_lam_viec?.ten_ca || "---"}
            </span>
        ),
    },
    {
        accessorKey: "gio_vao",
        header: "Giờ vào",
        cell: ({ row }) => (
            <span className="text-gray-700 font-mono text-sm">
                {row.original.gio_vao || "--:--"}
            </span>
        ),
    },
    {
        accessorKey: "gio_ra",
        header: "Giờ ra",
        cell: ({ row }) => (
            <span className="text-gray-700 font-mono text-sm">
                {row.original.gio_ra || "--:--"}
            </span>
        ),
    },
    {
        accessorKey: "trang_thai",
        header: "Trạng thái",
        cell: ({ row }) => {
            const status = row.original.trang_thai;
            const config = {
                0: { label: "Chưa vào", className: "bg-gray-100 text-gray-700" },
                1: { label: "Đang làm", className: "bg-blue-100 text-blue-700" },
                2: { label: "Hoàn thành", className: "bg-green-100 text-green-700" },
                3: { label: "Vắng", className: "bg-red-100 text-red-700" },
            }[status] || { label: "---", className: "bg-gray-100 text-gray-700" };

            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
                    {config.label}
                </span>
            );
        },
    },
];

// ============================================================================
// THE THONG KE
// ============================================================================

interface StatCardProps {
    title: string;
    value: number | string;
    colorVar: string;
}

function StatCard({ title, value, colorVar }: StatCardProps) {
    return (
        <div className="rounded-xl border p-4 bg-white" style={{ borderColor: "var(--gray-200)" }}>
            <div className="flex items-center gap-3">
                <div className="w-3 h-10 rounded-full" style={{ backgroundColor: colorVar }} />
                <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-sm text-gray-500">{title}</p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// TRANG HR
// ============================================================================

export default function HRPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<"shifts" | "attendance">("shifts");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Fetch ca lam viec
    const { data: shiftsData, isLoading: shiftsLoading } = useQuery({
        queryKey: ["shifts", page, limit],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<CaLamViec>>("/shifts", {
                params: { page, limit },
            });
            return response.data;
        },
        enabled: activeTab === "shifts",
    });

    // Fetch cham cong hom nay
    const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
        queryKey: ["attendance-today"],
        queryFn: async () => {
            const response = await httpClient.get("/attendance/today");
            return response.data;
        },
        enabled: activeTab === "attendance",
    });

    const pagination: DataTablePagination | undefined = shiftsData?.meta ? {
        page: shiftsData.meta.page,
        limit: shiftsData.meta.limit,
        total: shiftsData.meta.total,
        totalPages: shiftsData.meta.totalPages,
    } : undefined;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nhân sự & Ca làm</h1>
                    <p className="text-gray-500 mt-1">Quản lý nhân viên, ca làm việc và chấm công</p>
                </div>
                <Button
                    onClick={() => toast({ title: "Thêm mới", description: "Chức năng đang phát triển" })}
                    style={{ backgroundColor: "var(--primary-blue)" }}
                    className="text-white"
                >
                    + Thêm ca làm
                </Button>
            </div>

            {/* Thong ke */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard title="Tổng nhân viên" value={0} colorVar="var(--primary-blue)" />
                <StatCard title="Đang làm việc" value={0} colorVar="var(--success)" />
                <StatCard title="Ca hôm nay" value={0} colorVar="#EC4899" />
                <StatCard title="Vắng mặt" value={0} colorVar="var(--error)" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                    onClick={() => setActiveTab("shifts")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === "shifts"
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-500 hover:bg-gray-100"
                    )}
                >
                    Ca làm việc
                </button>
                <button
                    onClick={() => setActiveTab("attendance")}
                    className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                        activeTab === "attendance"
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-500 hover:bg-gray-100"
                    )}
                >
                    Chấm công hôm nay
                </button>
            </div>

            {/* Content */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {activeTab === "shifts" ? "Danh sách ca làm việc" : "Bảng chấm công hôm nay"}
                    </CardTitle>
                    <CardDescription>
                        {activeTab === "shifts"
                            ? "Quản lý các ca làm việc trong hệ thống"
                            : "Theo dõi chấm công nhân viên"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {activeTab === "shifts" ? (
                        <DataTable
                            columns={shiftColumns}
                            data={shiftsData?.data || []}
                            pagination={pagination}
                            onPaginationChange={(newPage) => setPage(newPage)}
                            isLoading={shiftsLoading}
                            emptyMessage="Chưa có ca làm việc nào"
                        />
                    ) : (
                        <DataTable
                            columns={attendanceColumns}
                            data={attendanceData?.data || []}
                            isLoading={attendanceLoading}
                            emptyMessage="Chưa có dữ liệu chấm công hôm nay"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
