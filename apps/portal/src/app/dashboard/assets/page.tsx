/**
 * Assets - Trang Quan ly Tai san & Thiet bi
 * Module AssetTrack - ServiceOS
 * 
 * Features:
 * - Quan ly tai san
 * - Theo doi thiet bi
 * - Bao tri
 * - Lich su su dung
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

interface TaiSan {
    id: string;
    ma_tai_san: string;
    ten_tai_san: string;
    mo_ta?: string;
    loai_tai_san?: string;
    gia_tri?: number;
    ngay_mua?: string;
    tinh_trang: "available" | "in_use" | "maintenance" | "disposed";
    nguoi_su_dung?: {
        ho_ten: string;
    };
    vi_tri?: string;
    ngay_tao: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(value);
}

// ============================================================================
// CAU HINH TINH TRANG
// ============================================================================

const TINH_TRANG_CONFIG: Record<string, { label: string; className: string }> = {
    available: { label: "Sẵn sàng", className: "bg-green-100 text-green-700" },
    in_use: { label: "Đang sử dụng", className: "bg-blue-100 text-blue-700" },
    maintenance: { label: "Bảo trì", className: "bg-yellow-100 text-yellow-700" },
    disposed: { label: "Thanh lý", className: "bg-red-100 text-red-700" },
};

// ============================================================================
// DINH NGHIA COT
// ============================================================================

const columns: ColumnDef<TaiSan>[] = [
    {
        accessorKey: "ma_tai_san",
        header: "Mã tài sản",
        cell: ({ row }) => (
            <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                {row.original.ma_tai_san || "---"}
            </span>
        ),
    },
    {
        accessorKey: "ten_tai_san",
        header: "Tên tài sản",
        cell: ({ row }) => (
            <div className="max-w-xs">
                <p className="font-medium text-gray-900 truncate">{row.original.ten_tai_san}</p>
                {row.original.loai_tai_san && (
                    <p className="text-xs text-gray-500">{row.original.loai_tai_san}</p>
                )}
            </div>
        ),
    },
    {
        accessorKey: "gia_tri",
        header: "Giá trị",
        cell: ({ row }) => (
            <span className="text-gray-700">
                {row.original.gia_tri ? formatCurrency(row.original.gia_tri) : "---"}
            </span>
        ),
    },
    {
        accessorKey: "tinh_trang",
        header: "Tình trạng",
        cell: ({ row }) => {
            const config = TINH_TRANG_CONFIG[row.original.tinh_trang] || TINH_TRANG_CONFIG.available;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
                    {config.label}
                </span>
            );
        },
    },
    {
        accessorKey: "nguoi_su_dung",
        header: "Người sử dụng",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.nguoi_su_dung?.ho_ten || "Chưa gán"}
            </span>
        ),
    },
    {
        accessorKey: "vi_tri",
        header: "Vị trí",
        cell: ({ row }) => (
            <span className="text-gray-500 text-sm">{row.original.vi_tri || "---"}</span>
        ),
    },
    {
        accessorKey: "ngay_mua",
        header: "Ngày mua",
        cell: ({ row }) => {
            const date = row.original.ngay_mua;
            if (!date) return "---";
            return new Date(date).toLocaleDateString("vi-VN");
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
// TRANG ASSETS
// ============================================================================

export default function AssetsPage() {
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    // Fetch tai san
    const { data, isLoading } = useQuery({
        queryKey: ["assets", page, limit, search],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<TaiSan>>("/assets", {
                params: { page, limit, search: search || undefined },
            });
            return response.data;
        },
    });

    // Fetch thong ke
    const { data: statsData } = useQuery({
        queryKey: ["assets-stats"],
        queryFn: async () => {
            try {
                const response = await httpClient.get("/assets/count");
                return response.data;
            } catch {
                return { total: 0, available: 0, in_use: 0, maintenance: 0 };
            }
        },
    });

    const pagination: DataTablePagination | undefined = data?.meta ? {
        page: data.meta.page,
        limit: data.meta.limit,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
    } : undefined;

    const handleEdit = (row: TaiSan) => {
        toast({ title: "Sửa tài sản", description: `Đang phát triển cho: ${row.ten_tai_san}` });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tài sản & Thiết bị</h1>
                    <p className="text-gray-500 mt-1">Theo dõi và quản lý tài sản doanh nghiệp</p>
                </div>
                <Button
                    onClick={() => toast({ title: "Thêm tài sản", description: "Chức năng đang phát triển" })}
                    style={{ backgroundColor: "var(--primary-blue)" }}
                    className="text-white"
                >
                    + Thêm tài sản
                </Button>
            </div>

            {/* Thong ke */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng tài sản"
                    value={statsData?.total ?? data?.meta?.total ?? 0}
                    colorVar="var(--primary-blue)"
                />
                <StatCard
                    title="Sẵn sàng"
                    value={statsData?.available ?? 0}
                    colorVar="var(--success)"
                />
                <StatCard
                    title="Đang sử dụng"
                    value={statsData?.in_use ?? 0}
                    colorVar="#8B5CF6"
                />
                <StatCard
                    title="Đang bảo trì"
                    value={statsData?.maintenance ?? 0}
                    colorVar="#F59E0B"
                />
            </div>

            {/* Bang tai san */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách tài sản</CardTitle>
                    <CardDescription>Quản lý tài sản và thiết bị của doanh nghiệp</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data?.data || []}
                        pagination={pagination}
                        onPaginationChange={(newPage) => setPage(newPage)}
                        searchPlaceholder="Tìm kiếm tài sản..."
                        searchValue={search}
                        onSearchChange={setSearch}
                        isLoading={isLoading}
                        emptyMessage="Chưa có tài sản nào"
                        onEdit={handleEdit}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
