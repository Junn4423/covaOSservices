/**
 * Finance - Trang Thu chi Noi bo
 * Module CashFlow - ServiceOS
 * 
 * Features:
 * - Quan ly thu chi
 * - Bao cao tai chinh
 * - Phan loai giao dich
 * - Thong ke
 */

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import httpClient, { type PaginatedResponse } from "@/lib/http";
import { DataTable, type DataTablePagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface GiaoDich {
    id: string;
    ma_giao_dich: string;
    loai_giao_dich: "THU" | "CHI";
    so_tien: number;
    danh_muc?: {
        ten_danh_muc: string;
    };
    nguoi_giao_dich?: {
        ho_ten: string;
    };
    mo_ta?: string;
    phuong_thuc_thanh_toan: "TIEN_MAT" | "CHUYEN_KHOAN" | "THE" | "VI_DIEN_TU";
    trang_thai: "draft" | "pending" | "completed" | "cancelled";
    ngay_giao_dich: string;
    ngay_tao: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const TRANG_THAI_CONFIG: Record<string, { label: string; className: string }> = {
    draft: { label: "Nháp", className: "bg-gray-100 text-gray-700" },
    pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-700" },
    completed: { label: "Hoàn thành", className: "bg-green-100 text-green-700" },
    cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
};

const PHUONG_THUC_CONFIG: Record<string, string> = {
    TIEN_MAT: "Tiền mặt",
    CHUYEN_KHOAN: "Chuyển khoản",
    THE: "Thẻ",
    VI_DIEN_TU: "Ví điện tử",
};

// ============================================================================
// COLUMNS
// ============================================================================

const columns: ColumnDef<GiaoDich>[] = [
    {
        accessorKey: "ma_giao_dich",
        header: "Mã GD",
        cell: ({ row }) => (
            <span className="font-mono text-sm font-medium">
                {row.original.ma_giao_dich}
            </span>
        ),
    },
    {
        accessorKey: "loai_giao_dich",
        header: "Loại",
        cell: ({ row }) => {
            const isThu = row.original.loai_giao_dich === "THU";
            return (
                <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    isThu ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                    {isThu ? "Thu" : "Chi"}
                </span>
            );
        },
    },
    {
        accessorKey: "mo_ta",
        header: "Mô tả",
        cell: ({ row }) => (
            <div className="max-w-xs">
                <p className="font-medium text-gray-900 truncate">
                    {row.original.mo_ta || "---"}
                </p>
                <p className="text-xs text-gray-500">
                    {row.original.danh_muc?.ten_danh_muc}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "so_tien",
        header: "Số tiền",
        cell: ({ row }) => {
            const isThu = row.original.loai_giao_dich === "THU";
            return (
                <span className={cn(
                    "font-medium",
                    isThu ? "text-green-600" : "text-red-600"
                )}>
                    {isThu ? "+" : "-"}{row.original.so_tien?.toLocaleString("vi-VN")} đ
                </span>
            );
        },
    },
    {
        accessorKey: "phuong_thuc_thanh_toan",
        header: "Phương thức",
        cell: ({ row }) => (
            <span className="text-gray-600 text-sm">
                {PHUONG_THUC_CONFIG[row.original.phuong_thuc_thanh_toan] || row.original.phuong_thuc_thanh_toan}
            </span>
        ),
    },
    {
        accessorKey: "ngay_giao_dich",
        header: "Ngày GD",
        cell: ({ row }) => {
            const date = row.original.ngay_giao_dich;
            if (!date) return "---";
            return new Date(date).toLocaleDateString("vi-VN");
        },
    },
    {
        accessorKey: "trang_thai",
        header: "Trạng thái",
        cell: ({ row }) => {
            const config = TRANG_THAI_CONFIG[row.original.trang_thai] || TRANG_THAI_CONFIG.draft;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
                    {config.label}
                </span>
            );
        },
    },
];

// ============================================================================
// STAT CARD
// ============================================================================

interface StatCardProps {
    title: string;
    value: number | string;
    colorVar: string;
    trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, colorVar, trend }: StatCardProps) {
    return (
        <div className="rounded-xl border p-4 bg-white" style={{ borderColor: "var(--gray-200)" }}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-10 rounded-full" style={{ backgroundColor: colorVar }} />
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-500">{title}</p>
                    </div>
                </div>
                {trend && (
                    <span className={cn(
                        "text-xs font-medium",
                        trend.isPositive ? "text-green-600" : "text-red-600"
                    )}>
                        {trend.isPositive ? "↑" : "↓"} {trend.value}%
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// PAGE
// ============================================================================

export default function FinancePage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("all");
    const [page, setPage] = useState(1);
    const limit = 10;

    // Fetch giao dich
    const { data, isLoading } = useQuery({
        queryKey: ["finance", "giao-dich", page, limit, activeTab],
        queryFn: async () => {
            const params: Record<string, unknown> = { page, limit };
            if (activeTab !== "all") {
                params.loai = activeTab === "thu" ? "THU" : "CHI";
            }
            const response = await httpClient.get<PaginatedResponse<GiaoDich>>("/finance/giao-dich", {
                params,
            });
            return response.data;
        },
    });

    const pagination: DataTablePagination | undefined = data?.meta ? {
        page: data.meta.page,
        limit: data.meta.limit,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
    } : undefined;

    // Calculate totals (mock)
    const tongThu = 150000000;
    const tongChi = 85000000;
    const soDu = tongThu - tongChi;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Thu chi nội bộ</h1>
                    <p className="text-gray-500 mt-1">Quản lý dòng tiền và giao dịch nội bộ</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => toast({ title: "Ghi chi", description: "Đang phát triển" })}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                        + Ghi chi
                    </Button>
                    <Button
                        onClick={() => toast({ title: "Ghi thu", description: "Đang phát triển" })}
                        style={{ backgroundColor: "var(--success)" }}
                        className="text-white"
                    >
                        + Ghi thu
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng thu tháng này"
                    value={`${(tongThu / 1000000).toFixed(0)}M`}
                    colorVar="var(--success)"
                    trend={{ value: 12, isPositive: true }}
                />
                <StatCard
                    title="Tổng chi tháng này"
                    value={`${(tongChi / 1000000).toFixed(0)}M`}
                    colorVar="#EF4444"
                    trend={{ value: 5, isPositive: false }}
                />
                <StatCard
                    title="Số dư hiện tại"
                    value={`${(soDu / 1000000).toFixed(0)}M`}
                    colorVar="var(--primary-blue)"
                />
                <StatCard
                    title="Giao dịch tháng này"
                    value={data?.meta?.total ?? 0}
                    colorVar="#8B5CF6"
                />
            </div>

            {/* Chart placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Biểu đồ thu chi</CardTitle>
                    <CardDescription>Thống kê thu chi theo thời gian</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📊</span>
                            </div>
                            <p className="text-gray-500">Biểu đồ sẽ được hiển thị tại đây</p>
                            <p className="text-xs text-gray-400 mt-1">Tích hợp Chart.js hoặc Recharts</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(val: string) => { setActiveTab(val); setPage(1); }}>
                <TabsList className="bg-gray-100">
                    <TabsTrigger value="all">Tất cả</TabsTrigger>
                    <TabsTrigger value="thu">Khoản thu</TabsTrigger>
                    <TabsTrigger value="chi">Khoản chi</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách giao dịch</CardTitle>
                            <CardDescription>Quản lý và theo dõi các giao dịch thu chi</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={columns}
                                data={data?.data || []}
                                pagination={pagination}
                                onPaginationChange={(newPage) => setPage(newPage)}
                                isLoading={isLoading}
                                emptyMessage="Chưa có giao dịch nào"
                                onEdit={(row) => toast({ title: "Xem giao dịch", description: row.ma_giao_dich })}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
