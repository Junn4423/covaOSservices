/**
 * TechMate - Jobs Page (Gold Standard Example)
 * 
 * Features:
 * - Data table with server-side pagination
 * - Search with debounce
 * - Loading skeleton
 * - Error handling
 * - Empty state
 * - Vietnamese UI
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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

interface Job {
    id: string;
    ma_cong_viec: string;
    tieu_de: string;
    mo_ta?: string;
    trang_thai: "pending" | "in_progress" | "completed" | "cancelled";
    do_uu_tien: "low" | "medium" | "high" | "urgent";
    ngay_bat_dau?: string;
    ngay_ket_thuc?: string;
    ngay_tao: string;
    khach_hang?: {
        ten_khach_hang: string;
    };
    nhan_vien?: {
        ho_ten: string;
    };
}

// ============================================================================
// STATUS & PRIORITY CONFIGS
// ============================================================================

const STATUS_CONFIG = {
    pending: { label: "Cho xu ly", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
    in_progress: { label: "Dang xu ly", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    completed: { label: "Hoan thanh", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    cancelled: { label: "Da huy", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const PRIORITY_CONFIG = {
    low: { label: "Thap", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
    medium: { label: "Trung binh", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    high: { label: "Cao", color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" },
    urgent: { label: "Khan cap", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

// ============================================================================
// COLUMNS DEFINITION
// ============================================================================

const columns: ColumnDef<Job>[] = [
    {
        accessorKey: "ma_cong_viec",
        header: "Ma CV",
        cell: ({ row }) => (
            <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                {row.original.ma_cong_viec || "---"}
            </span>
        ),
    },
    {
        accessorKey: "tieu_de",
        header: "Tieu de",
        cell: ({ row }) => (
            <div>
                <p className="font-medium text-slate-900 dark:text-white truncate max-w-xs">
                    {row.original.tieu_de}
                </p>
                {row.original.mo_ta && (
                    <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                        {row.original.mo_ta}
                    </p>
                )}
            </div>
        ),
    },
    {
        accessorKey: "trang_thai",
        header: "Trang thai",
        cell: ({ row }) => {
            const status = row.original.trang_thai;
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.color)}>
                    {config.label}
                </span>
            );
        },
    },
    {
        accessorKey: "do_uu_tien",
        header: "Uu tien",
        cell: ({ row }) => {
            const priority = row.original.do_uu_tien;
            const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.color)}>
                    {config.label}
                </span>
            );
        },
    },
    {
        accessorKey: "khach_hang",
        header: "Khach hang",
        cell: ({ row }) => (
            <span className="text-slate-600 dark:text-slate-400">
                {row.original.khach_hang?.ten_khach_hang || "---"}
            </span>
        ),
    },
    {
        accessorKey: "nhan_vien",
        header: "Phu trach",
        cell: ({ row }) => (
            <span className="text-slate-600 dark:text-slate-400">
                {row.original.nhan_vien?.ho_ten || "Chua phan cong"}
            </span>
        ),
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
// STATS CARDS
// ============================================================================

interface StatCardProps {
    title: string;
    value: number | string;
    description?: string;
    color: string;
}

function StatCard({ title, value, description, color }: StatCardProps) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
                <div className={cn("w-3 h-10 rounded-full", color)} />
                <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                    <p className="text-sm text-slate-500">{title}</p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// JOBS PAGE COMPONENT
// ============================================================================

export default function JobsPage() {
    const router = useRouter();
    const { toast } = useToast();

    // Pagination & Search state
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    // Fetch jobs with TanStack Query
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["jobs", { page, limit, search }],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<Job>>("/jobs", {
                params: { page, limit, search: search || undefined },
            });
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Pagination data
    const pagination: DataTablePagination | undefined = data?.meta
        ? {
            page: data.meta.page,
            limit: data.meta.limit,
            total: data.meta.total,
            totalPages: data.meta.totalPages,
        }
        : undefined;

    // Handlers
    const handlePaginationChange = useCallback((newPage: number, newLimit: number) => {
        setPage(newPage);
    }, []);

    const handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setPage(1); // Reset to first page on search
    }, []);

    const handleEdit = useCallback((job: Job) => {
        toast({
            title: "Chinh sua cong viec",
            description: `Dang mo chinh sua: ${job.tieu_de}`,
        });
        // router.push(`/dashboard/jobs/${job.id}/edit`);
    }, [toast]);

    const handleDelete = useCallback((job: Job) => {
        toast({
            title: "Xoa cong viec",
            description: `Xac nhan xoa: ${job.tieu_de}?`,
            variant: "destructive",
        });
    }, [toast]);

    const handleRowClick = useCallback((job: Job) => {
        // router.push(`/dashboard/jobs/${job.id}`);
    }, []);

    // Calculate stats from data (or use API if available)
    const stats = useMemo(() => {
        if (!data?.data) return { pending: 0, inProgress: 0, completed: 0, total: 0 };

        const jobs = data.data;
        return {
            pending: jobs.filter((j) => j.trang_thai === "pending").length,
            inProgress: jobs.filter((j) => j.trang_thai === "in_progress").length,
            completed: jobs.filter((j) => j.trang_thai === "completed").length,
            total: data.meta?.total || jobs.length,
        };
    }, [data]);

    // Error state
    if (isError) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="text-red-500 mb-4">[!]</div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        Loi tai du lieu
                    </h3>
                    <p className="text-slate-500 mb-4">
                        {(error as Error)?.message || "Khong the tai danh sach cong viec"}
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        Thu lai
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Quan ly cong viec
                    </h1>
                    <p className="text-slate-500 mt-1">
                        TechMate - Tao, phan cong va theo doi cong viec
                    </p>
                </div>
                <Button
                    onClick={() => toast({ title: "Tao cong viec moi", description: "Tinh nang dang phat trien" })}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                    + Tao cong viec
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tong cong viec"
                    value={stats.total}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="Cho xu ly"
                    value={stats.pending}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Dang xu ly"
                    value={stats.inProgress}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Hoan thanh"
                    value={stats.completed}
                    color="bg-emerald-500"
                />
            </div>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sach cong viec</CardTitle>
                    <CardDescription>
                        Quan ly tat ca cong viec cua doanh nghiep
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data?.data || []}
                        pagination={pagination}
                        onPaginationChange={handlePaginationChange}
                        searchPlaceholder="Tim kiem cong viec..."
                        searchValue={search}
                        onSearchChange={handleSearchChange}
                        isLoading={isLoading}
                        emptyMessage="Chua co cong viec nao"
                        onRowClick={handleRowClick}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
