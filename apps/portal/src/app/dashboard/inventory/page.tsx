/**
 * Inventory - Trang Quan ly Kho & San pham
 * Module Stockpile - ServiceOS
 * 
 * Features:
 * - Quan ly san pham
 * - Quan ly kho
 * - Ton kho
 * - Xuat nhap kho
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

interface SanPham {
    id: string;
    ma_sku: string;
    ten_san_pham: string;
    mo_ta?: string;
    gia_ban: number;
    gia_nhap?: number;
    don_vi_tinh?: string;
    trang_thai: number;
    nhom_san_pham?: {
        id: string;
        ten_nhom: string;
    };
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
// DINH NGHIA COT
// ============================================================================

const columns: ColumnDef<SanPham>[] = [
    {
        accessorKey: "ma_sku",
        header: "Mã SKU",
        cell: ({ row }) => (
            <span className="font-mono text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                {row.original.ma_sku || "---"}
            </span>
        ),
    },
    {
        accessorKey: "ten_san_pham",
        header: "Tên sản phẩm",
        cell: ({ row }) => (
            <div className="max-w-xs">
                <p className="font-medium text-gray-900 truncate">{row.original.ten_san_pham}</p>
                {row.original.nhom_san_pham && (
                    <p className="text-xs text-gray-500">{row.original.nhom_san_pham.ten_nhom}</p>
                )}
            </div>
        ),
    },
    {
        accessorKey: "don_vi_tinh",
        header: "Đơn vị",
        cell: ({ row }) => (
            <span className="text-gray-600">{row.original.don_vi_tinh || "---"}</span>
        ),
    },
    {
        accessorKey: "gia_nhap",
        header: "Giá nhập",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.gia_nhap ? formatCurrency(row.original.gia_nhap) : "---"}
            </span>
        ),
    },
    {
        accessorKey: "gia_ban",
        header: "Giá bán",
        cell: ({ row }) => (
            <span className="font-medium text-green-600">
                {formatCurrency(row.original.gia_ban)}
            </span>
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
                {row.original.trang_thai === 1 ? "Đang bán" : "Ngừng bán"}
            </span>
        ),
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
// TRANG INVENTORY
// ============================================================================

export default function InventoryPage() {
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    // Fetch san pham
    const { data, isLoading } = useQuery({
        queryKey: ["products", page, limit, search],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<SanPham>>("/san-pham", {
                params: { page, limit, search: search || undefined },
            });
            return response.data;
        },
    });

    // Fetch thong ke
    const { data: statsData } = useQuery({
        queryKey: ["products-stats"],
        queryFn: async () => {
            try {
                const response = await httpClient.get("/san-pham/count");
                return response.data;
            } catch {
                return { total: 0, active: 0 };
            }
        },
    });

    const pagination: DataTablePagination | undefined = data?.meta ? {
        page: data.meta.page,
        limit: data.meta.limit,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
    } : undefined;

    const handleEdit = (row: SanPham) => {
        toast({ title: "Sửa sản phẩm", description: `Đang phát triển cho: ${row.ten_san_pham}` });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kho & Vật tư</h1>
                    <p className="text-gray-500 mt-1">Quản lý sản phẩm, kho hàng và tồn kho</p>
                </div>
                <Button
                    onClick={() => toast({ title: "Thêm sản phẩm", description: "Chức năng đang phát triển" })}
                    style={{ backgroundColor: "var(--primary-blue)" }}
                    className="text-white"
                >
                    + Thêm sản phẩm
                </Button>
            </div>

            {/* Thong ke */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng sản phẩm"
                    value={statsData?.total ?? data?.meta?.total ?? 0}
                    colorVar="var(--primary-blue)"
                />
                <StatCard
                    title="Đang bán"
                    value={statsData?.active ?? 0}
                    colorVar="var(--success)"
                />
                <StatCard
                    title="Tổng kho"
                    value={statsData?.warehouses ?? 0}
                    colorVar="#F59E0B"
                />
                <StatCard
                    title="Cảnh báo tồn"
                    value={statsData?.lowStock ?? 0}
                    colorVar="var(--error)"
                />
            </div>

            {/* Bang san pham */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách sản phẩm</CardTitle>
                    <CardDescription>Quản lý sản phẩm và vật tư trong kho</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data?.data || []}
                        pagination={pagination}
                        onPaginationChange={(newPage) => setPage(newPage)}
                        searchPlaceholder="Tìm kiếm sản phẩm..."
                        searchValue={search}
                        onSearchChange={setSearch}
                        isLoading={isLoading}
                        emptyMessage="Chưa có sản phẩm nào"
                        onEdit={handleEdit}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
