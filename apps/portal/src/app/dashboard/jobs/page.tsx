/**
 * TechMate - Trang Cong viec (Vi du mau)
 * Su dung Design System ServiceOS
 * 
 * Features:
 * - Data table voi phan trang server-side
 * - Tim kiem voi debounce
 * - Loading skeleton
 * - Xu ly loi
 * - Trang thai rong
 * - Giao dien Tieng Viet
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
// CAU HINH TRANG THAI & UU TIEN (Su dung CSS Variables)
// ============================================================================

const STATUS_CONFIG = {
    pending: { label: "Chờ xử lý", className: "badge-warning" },
    in_progress: { label: "Đang xử lý", className: "badge-info" },
    completed: { label: "Hoàn thành", className: "badge-success" },
    cancelled: { label: "Đã hủy", className: "badge-error" },
};

const PRIORITY_CONFIG = {
    low: { label: "Thấp", className: "bg-[var(--gray-100)] text-[var(--gray-600)]" },
    medium: { label: "Trung bình", className: "badge-info" },
    high: { label: "Cao", className: "badge-warning" },
    urgent: { label: "Khẩn cấp", className: "badge-error" },
};

// ============================================================================
// DINH NGHIA COT
// ============================================================================

const columns: ColumnDef<Job>[] = [
    {
        accessorKey: "ma_cong_viec",
        header: "Mã công việc",
        cell: ({ row }) => (
            <span 
                className="font-mono text-xs px-2 py-1 rounded"
                style={{ backgroundColor: "var(--gray-100)", color: "var(--gray-700)" }}
            >
                {row.original.ma_cong_viec || "---"}
            </span>
        ),
    },
    {
        accessorKey: "tieu_de",
        header: "Tiêu đề công việc",
        cell: ({ row }) => (
            <div>
                <p 
                    className="font-medium truncate max-w-xs"
                    style={{ color: "var(--gray-900)" }}
                >
                    {row.original.tieu_de}
                </p>
                {row.original.mo_ta && (
                    <p 
                        className="text-xs truncate max-w-xs mt-0.5"
                        style={{ color: "var(--gray-500)" }}
                    >
                        {row.original.mo_ta}
                    </p>
                )}
            </div>
        ),
    },
    {
        accessorKey: "trang_thai",
        header: "Trạng thái",
        cell: ({ row }) => {
            const status = row.original.trang_thai;
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
                    {config.label}
                </span>
            );
        },
    },
    {
        accessorKey: "do_uu_tien",
        header: "Mức ưu tiên",
        cell: ({ row }) => {
            const priority = row.original.do_uu_tien;
            const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
                    {config.label}
                </span>
            );
        },
    },
    {
        accessorKey: "khach_hang",
        header: "Khách hàng",
        cell: ({ row }) => (
            <span style={{ color: "var(--gray-600)" }}>
                {row.original.khach_hang?.ten_khach_hang || "---"}
            </span>
        ),
    },
    {
        accessorKey: "nhan_vien",
        header: "Người phụ trách",
        cell: ({ row }) => (
            <span style={{ color: "var(--gray-600)" }}>
                {row.original.nhan_vien?.ho_ten || "Chua phan cong"}
            </span>
        ),
    },
    {
        accessorKey: "ngay_tao",
        header: "Ngày tạo",
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
    description?: string;
    colorVar: string;
}

function StatCard({ title, value, colorVar }: StatCardProps) {
    return (
        <div 
            className="rounded-xl border p-4"
            style={{ 
                backgroundColor: "var(--white)",
                borderColor: "var(--gray-200)"
            }}
        >
            <div className="flex items-center gap-3">
                <div 
                    className="w-3 h-10 rounded-full"
                    style={{ backgroundColor: colorVar }}
                />
                <div>
                    <p 
                        className="text-2xl font-bold"
                        style={{ color: "var(--gray-900)" }}
                    >
                        {value}
                    </p>
                    <p 
                        className="text-sm"
                        style={{ color: "var(--gray-500)" }}
                    >
                        {title}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// TRANG CONG VIEC
// ============================================================================

export default function JobsPage() {
    const router = useRouter();
    const { toast } = useToast();

    // State phan trang va tim kiem
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    // Lay danh sach cong viec voi TanStack Query
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["jobs", { page, limit, search }],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<Job>>("/jobs", {
                params: { page, limit, search: search || undefined },
            });
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 phut
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
        setPage(1); // Reset ve trang dau khi tim kiem
    }, []);

    const handleEdit = useCallback((job: Job) => {
        toast({
            title: "Chỉnh sửa công việc",
            description: `Đang mở chỉnh sửa: ${job.tieu_de}`,
        });
    }, [toast]);

    const handleDelete = useCallback((job: Job) => {
        toast({
            title: "Xóa công việc",
            description: `Xác nhận xóa: ${job.tieu_de}?`,
            variant: "destructive",
        });
    }, [toast]);

    const handleRowClick = useCallback(() => {
        // router.push(`/dashboard/jobs/${job.id}`);
    }, []);

    // Tinh toan thong ke tu du lieu
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

    // Trang thai loi
    if (isError) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div style={{ color: "var(--error)" }} className="mb-4 text-4xl">[!]</div>
                    <h3 
                        className="text-lg font-semibold mb-2"
                        style={{ color: "var(--gray-900)" }}
                    >
                        lỗi tải dữ liệu
                    </h3>
                    <p 
                        className="mb-4"
                        style={{ color: "var(--gray-500)" }}
                    >
                        {(error as Error)?.message || "Khong the tai danh sach cong viec"}
                    </p>
                    <Button 
                        onClick={() => window.location.reload()}
                        style={{ backgroundColor: "var(--primary-dark)" }}
                    >
                        Thử lại
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
                    <h1 
                        className="text-2xl font-bold"
                        style={{ color: "var(--gray-900)" }}
                    >
                        Quản lý công việc
                    </h1>
                    <p 
                        className="mt-1"
                        style={{ color: "var(--gray-500)" }}
                    >
                        TechMate - Tạo, phân công và theo dõi công việc
                    </p>
                </div>
                <Button
                    onClick={() => toast({ title: "Tạo công việc mới", description: "Tính năng đang phát triển" })}
                    style={{ 
                        backgroundColor: "var(--primary-dark)",
                        boxShadow: "0 4px 14px rgba(18, 78, 102, 0.25)"
                    }}
                >
                    + Tạo công việc
                </Button>
            </div>

            {/* Thẻ thống kê */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tổng công việc"
                    value={stats.total}
                    colorVar="var(--primary-dark)"
                />
                <StatCard
                    title="Chờ xử lý"
                    value={stats.pending}
                    colorVar="var(--warning)"
                />
                <StatCard
                    title="Đang xử lý"
                    value={stats.inProgress}
                    colorVar="var(--primary-blue)"
                />
                <StatCard
                    title="Hoàn thành"
                    value={stats.completed}
                    colorVar="var(--primary-green)"
                />
            </div>

            {/* Bang du lieu */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách công việc</CardTitle>
                    <CardDescription>
                        Quản lý tất cả công việc của doanh nghiệp
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data?.data || []}
                        pagination={pagination}
                        onPaginationChange={handlePaginationChange}
                        searchPlaceholder="Tìm kiếm công việc..."
                        searchValue={search}
                        onSearchChange={handleSearchChange}
                        isLoading={isLoading}
                        emptyMessage="Chưa có công việc nào"
                        onRowClick={handleRowClick}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
