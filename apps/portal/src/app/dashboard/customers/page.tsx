/**
 * CustomerPortal - Trang Quan ly Khach hang
 * Module CustomerPortal - ServiceOS
 * 
 * Features:
 * - Hien thi danh sach khach hang
 * - Thong tin lien lac va dia chi
 * - Phan loai khach hang
 * - Tim kiem va phan trang
 * - Giao dien 100% Tieng Viet
 */

"use client";

import { useState, useMemo, useCallback } from "react";
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

interface KhachHang {
    id: string;
    ma_khach_hang?: string;
    ho_ten: string;
    so_dien_thoai?: string;
    email?: string;
    dia_chi?: string;
    thanh_pho?: string;
    quan_huyen?: string;
    loai_khach: "ca_nhan" | "doanh_nghiep";
    nguon_khach?: "FACEBOOK" | "WEBSITE" | "REFERRAL" | "KHAC";
    ghi_chu?: string;
    ngay_tao: string;
}

// ============================================================================
// CAU HINH LOAI KHACH & NGUON
// ============================================================================

const LOAI_KHACH_CONFIG: Record<string, { label: string; className: string }> = {
    ca_nhan: { label: "Ca nhan", className: "bg-blue-100 text-blue-700" },
    doanh_nghiep: { label: "Doanh nghiep", className: "bg-purple-100 text-purple-700" },
};

const NGUON_KHACH_CONFIG: Record<string, { label: string; className: string }> = {
    FACEBOOK: { label: "Facebook", className: "bg-blue-50 text-blue-600" },
    WEBSITE: { label: "Website", className: "bg-green-50 text-green-600" },
    REFERRAL: { label: "Gioi thieu", className: "bg-orange-50 text-orange-600" },
    KHAC: { label: "Khac", className: "bg-gray-100 text-gray-600" },
};

// ============================================================================
// DINH NGHIA COT
// ============================================================================

const columns: ColumnDef<KhachHang>[] = [
    {
        accessorKey: "ma_khach_hang",
        header: "Ma KH",
        cell: ({ row }) => (
            <span
                className="font-mono text-xs px-2 py-1 rounded bg-gray-100 text-gray-700"
            >
                {row.original.ma_khach_hang || `KH-${row.original.id.slice(0, 6).toUpperCase()}`}
            </span>
        ),
    },
    {
        accessorKey: "ho_ten",
        header: "Ho ten",
        cell: ({ row }) => (
            <div>
                <p className="font-medium text-gray-900">
                    {row.original.ho_ten}
                </p>
                {row.original.loai_khach && (
                    <span className={cn(
                        "inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium",
                        LOAI_KHACH_CONFIG[row.original.loai_khach]?.className || "bg-gray-100 text-gray-600"
                    )}>
                        {LOAI_KHACH_CONFIG[row.original.loai_khach]?.label || row.original.loai_khach}
                    </span>
                )}
            </div>
        ),
    },
    {
        accessorKey: "so_dien_thoai",
        header: "So dien thoai",
        cell: ({ row }) => (
            <span className="text-gray-700 font-medium">
                {row.original.so_dien_thoai || "---"}
            </span>
        ),
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
            <span className="text-gray-600 text-sm">
                {row.original.email || "---"}
            </span>
        ),
    },
    {
        accessorKey: "dia_chi",
        header: "Dia chi",
        cell: ({ row }) => {
            const parts = [
                row.original.dia_chi,
                row.original.quan_huyen,
                row.original.thanh_pho,
            ].filter(Boolean);

            return (
                <span className="text-gray-600 text-sm max-w-xs truncate block">
                    {parts.length > 0 ? parts.join(", ") : "---"}
                </span>
            );
        },
    },
    {
        accessorKey: "nguon_khach",
        header: "Nguon",
        cell: ({ row }) => {
            const nguon = row.original.nguon_khach || "KHAC";
            const config = NGUON_KHACH_CONFIG[nguon] || NGUON_KHACH_CONFIG.KHAC;
            return (
                <span className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    config.className
                )}>
                    {config.label}
                </span>
            );
        },
    },
    {
        accessorKey: "ngay_tao",
        header: "Ngay tao",
        cell: ({ row }) => {
            const date = row.original.ngay_tao;
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
        <div
            className="rounded-xl border p-4 bg-white"
            style={{ borderColor: "var(--gray-200)" }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-3 h-10 rounded-full"
                    style={{ backgroundColor: colorVar }}
                />
                <div>
                    <p className="text-2xl font-bold text-gray-900">
                        {value}
                    </p>
                    <p className="text-sm text-gray-500">
                        {title}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// TRANG CUSTOMERS - QUAN LY KHACH HANG
// ============================================================================

export default function CustomersPage() {
    const { toast } = useToast();

    // State phan trang va tim kiem
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    // Lay danh sach khach hang
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["customers", { page, limit, search }],
        queryFn: async () => {
            // Thu nhieu endpoint
            const endpoints = [
                "/techmate/khach-hang",
                "/customers",
                "/khach-hang",
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await httpClient.get<PaginatedResponse<KhachHang>>(endpoint, {
                        params: { page, limit, search: search || undefined },
                    });
                    return response.data;
                } catch {
                    continue;
                }
            }

            // Khong co endpoint nao hoat dong
            throw new Error("Khong the ket noi den API khach hang");
        },
        staleTime: 5 * 60 * 1000,
    });

    // Du lieu phan trang
    const pagination: DataTablePagination | undefined = data?.meta
        ? {
            page: data.meta.page,
            limit: data.meta.limit,
            total: data.meta.total,
            totalPages: data.meta.totalPages,
        }
        : undefined;

    // Xu ly su kien
    const handlePaginationChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const handleEdit = useCallback((kh: KhachHang) => {
        toast({
            title: "Chinh sua khach hang",
            description: `Dang mo thong tin: ${kh.ho_ten}`,
        });
    }, [toast]);

    const handleDelete = useCallback((kh: KhachHang) => {
        toast({
            title: "Xoa khach hang",
            description: `Xac nhan xoa: ${kh.ho_ten}?`,
            variant: "destructive",
        });
    }, [toast]);

    // Tinh toan thong ke
    const stats = useMemo(() => {
        if (!data?.data) return { total: 0, caNhan: 0, doanhNghiep: 0 };

        const customers = data.data;
        return {
            total: data.meta?.total || customers.length,
            caNhan: customers.filter((c) => c.loai_khach === "ca_nhan").length,
            doanhNghiep: customers.filter((c) => c.loai_khach === "doanh_nghiep").length,
        };
    }, [data]);

    // Trang thai loi
    if (isError) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="text-red-500 mb-4 text-4xl">[!]</div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">
                        Loi tai du lieu
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {(error as Error)?.message || "Khong the tai danh sach khach hang"}
                    </p>
                    <Button
                        onClick={() => window.location.reload()}
                        style={{ backgroundColor: "var(--primary-dark)" }}
                        className="text-white"
                    >
                        Thu lai
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Tieu de trang */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quan ly khach hang
                    </h1>
                    <p className="mt-1 text-gray-500">
                        CustomerPortal - Thong tin va quan he khach hang
                    </p>
                </div>
                <Button
                    onClick={() => toast({ title: "Them khach hang", description: "Tinh nang dang phat trien" })}
                    style={{
                        backgroundColor: "var(--primary-dark)",
                        boxShadow: "0 4px 14px rgba(18, 78, 102, 0.25)"
                    }}
                    className="text-white hover:brightness-110"
                >
                    + Them khach hang
                </Button>
            </div>

            {/* The thong ke */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Tong khach hang"
                    value={stats.total}
                    colorVar="var(--primary-dark)"
                />
                <StatCard
                    title="Ca nhan"
                    value={stats.caNhan}
                    colorVar="#3B82F6"
                />
                <StatCard
                    title="Doanh nghiep"
                    value={stats.doanhNghiep}
                    colorVar="#8B5CF6"
                />
            </div>

            {/* Bang du lieu */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sach khach hang</CardTitle>
                    <CardDescription>
                        Quan ly thong tin khach hang cua doanh nghiep
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data?.data || []}
                        pagination={pagination}
                        onPaginationChange={handlePaginationChange}
                        searchPlaceholder="Tim kiem khach hang..."
                        searchValue={search}
                        onSearchChange={handleSearchChange}
                        isLoading={isLoading}
                        emptyMessage="Chua co khach hang nao"
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

