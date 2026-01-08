/**
 * Routes - Trang Dieu phoi Lo trinh
 * Module RouteOptima - ServiceOS
 * 
 * Features:
 * - Quan ly lo trinh
 * - Vung phu trach
 * - Theo doi GPS
 * - Toi uu hoa lo trinh
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

interface LoTrinh {
    id: string;
    ten_lo_trinh: string;
    ngay_thuc_hien: string;
    nguoi_thuc_hien?: {
        ho_ten: string;
    };
    trang_thai: "draft" | "planned" | "in_progress" | "completed" | "cancelled";
    tong_diem_dung: number;
    khoang_cach_du_kien?: number;
    thoi_gian_du_kien?: number;
    ngay_tao: string;
}

// ============================================================================
// CAU HINH TRANG THAI
// ============================================================================

const TRANG_THAI_CONFIG: Record<string, { label: string; className: string }> = {
    draft: { label: "Nháp", className: "bg-gray-100 text-gray-700" },
    planned: { label: "Đã lên kế hoạch", className: "bg-blue-100 text-blue-700" },
    in_progress: { label: "Đang thực hiện", className: "bg-yellow-100 text-yellow-700" },
    completed: { label: "Hoàn thành", className: "bg-green-100 text-green-700" },
    cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
};

// ============================================================================
// DINH NGHIA COT
// ============================================================================

const columns: ColumnDef<LoTrinh>[] = [
    {
        accessorKey: "ten_lo_trinh",
        header: "Tên lộ trình",
        cell: ({ row }) => (
            <div className="max-w-xs">
                <p className="font-medium text-gray-900 truncate">{row.original.ten_lo_trinh}</p>
            </div>
        ),
    },
    {
        accessorKey: "ngay_thuc_hien",
        header: "Ngày thực hiện",
        cell: ({ row }) => {
            const date = row.original.ngay_thuc_hien;
            if (!date) return "---";
            return new Date(date).toLocaleDateString("vi-VN");
        },
    },
    {
        accessorKey: "nguoi_thuc_hien",
        header: "Người thực hiện",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.nguoi_thuc_hien?.ho_ten || "Chưa gán"}
            </span>
        ),
    },
    {
        accessorKey: "tong_diem_dung",
        header: "Số điểm dừng",
        cell: ({ row }) => (
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-sm font-medium">
                {row.original.tong_diem_dung} điểm
            </span>
        ),
    },
    {
        accessorKey: "khoang_cach_du_kien",
        header: "Khoảng cách",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.khoang_cach_du_kien
                    ? `${(row.original.khoang_cach_du_kien / 1000).toFixed(1)} km`
                    : "---"}
            </span>
        ),
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
// TRANG ROUTES
// ============================================================================

export default function RoutesPage() {
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    // Fetch lo trinh
    const { data, isLoading } = useQuery({
        queryKey: ["routes", page, limit],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<LoTrinh>>("/routes", {
                params: { page, limit },
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

    const handleEdit = (row: LoTrinh) => {
        toast({ title: "Xem lộ trình", description: `Đang phát triển cho: ${row.ten_lo_trinh}` });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Điều phối lộ trình</h1>
                    <p className="text-gray-500 mt-1">Tối ưu hóa lộ trình và theo dõi GPS</p>
                </div>
                <Button
                    onClick={() => toast({ title: "Tạo lộ trình", description: "Chức năng đang phát triển" })}
                    style={{ backgroundColor: "var(--primary-blue)" }}
                    className="text-white"
                >
                    + Tạo lộ trình mới
                </Button>
            </div>

            {/* Thong ke */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard title="Tổng lộ trình" value={data?.meta?.total ?? 0} colorVar="var(--primary-blue)" />
                <StatCard title="Đang thực hiện" value={0} colorVar="#F59E0B" />
                <StatCard title="Hoàn thành hôm nay" value={0} colorVar="var(--success)" />
                <StatCard title="Tổng km hôm nay" value="0 km" colorVar="#14B8A6" />
            </div>

            {/* Map placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Bản đồ theo dõi</CardTitle>
                    <CardDescription>Theo dõi vị trí và lộ trình thời gian thực</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🗺️</span>
                            </div>
                            <p className="text-gray-500">Bản đồ Google Maps sẽ được tích hợp tại đây</p>
                            <p className="text-xs text-gray-400 mt-1">Yêu cầu API Key để kích hoạt</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bang lo trinh */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách lộ trình</CardTitle>
                    <CardDescription>Quản lý và theo dõi các lộ trình</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data?.data || []}
                        pagination={pagination}
                        onPaginationChange={(newPage) => setPage(newPage)}
                        isLoading={isLoading}
                        emptyMessage="Chưa có lộ trình nào"
                        onEdit={handleEdit}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
