/**
 * Core - Trang Quan tri He thong
 * Module Core - ServiceOS
 * 
 * Features:
 * - Quan ly doanh nghiep
 * - Quan ly nguoi dung
 * - Phan quyen
 * - Cai dat he thong
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
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface NguoiDung {
    id: string;
    email: string;
    ho_ten: string;
    so_dien_thoai?: string;
    vai_tro: "admin" | "manager" | "technician" | "accountant" | "viewer";
    phong_ban?: string;
    trang_thai: number;
    ngay_tao: string;
}

// ============================================================================
// CAU HINH VAI TRO
// ============================================================================

const VAI_TRO_CONFIG: Record<string, { label: string; className: string }> = {
    admin: { label: "Quản trị viên", className: "bg-red-100 text-red-700" },
    manager: { label: "Quản lý", className: "bg-blue-100 text-blue-700" },
    technician: { label: "Kỹ thuật viên", className: "bg-green-100 text-green-700" },
    accountant: { label: "Kế toán", className: "bg-yellow-100 text-yellow-700" },
    viewer: { label: "Xem", className: "bg-gray-100 text-gray-700" },
};

// ============================================================================
// DINH NGHIA COT
// ============================================================================

const columns: ColumnDef<NguoiDung>[] = [
    {
        accessorKey: "ho_ten",
        header: "Họ tên",
        cell: ({ row }) => (
            <div>
                <p className="font-medium text-gray-900">{row.original.ho_ten}</p>
                <p className="text-xs text-gray-500">{row.original.email}</p>
            </div>
        ),
    },
    {
        accessorKey: "so_dien_thoai",
        header: "Số điện thoại",
        cell: ({ row }) => (
            <span className="text-gray-700">
                {row.original.so_dien_thoai || "---"}
            </span>
        ),
    },
    {
        accessorKey: "vai_tro",
        header: "Vai trò",
        cell: ({ row }) => {
            const config = VAI_TRO_CONFIG[row.original.vai_tro] || VAI_TRO_CONFIG.viewer;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
                    {config.label}
                </span>
            );
        },
    },
    {
        accessorKey: "phong_ban",
        header: "Phòng ban",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.phong_ban || "---"}
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
                {row.original.trang_thai === 1 ? "Hoạt động" : "Vô hiệu"}
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
// TRANG CORE
// ============================================================================

export default function CorePage() {
    const { toast } = useToast();
    const { user } = useAuthStore();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    // Fetch nguoi dung
    const { data, isLoading, error } = useQuery({
        queryKey: ["users", page, limit, search],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<NguoiDung>>("/users", {
                params: { page, limit, search: search || undefined },
            });
            return response.data;
        },
    });

    // Fetch thong ke
    const { data: statsData } = useQuery({
        queryKey: ["users-stats"],
        queryFn: async () => {
            try {
                const response = await httpClient.get("/users/count");
                return response.data;
            } catch {
                return { total: 0, active: 0, inactive: 0 };
            }
        },
    });

    const pagination: DataTablePagination | undefined = data?.meta ? {
        page: data.meta.page,
        limit: data.meta.limit,
        total: data.meta.total,
        totalPages: data.meta.totalPages,
    } : undefined;

    const handleEdit = (row: NguoiDung) => {
        toast({ title: "Chức năng sửa", description: `Đang phát triển cho: ${row.ho_ten}` });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản trị hệ thống</h1>
                    <p className="text-gray-500 mt-1">Quản lý người dùng và phân quyền</p>
                </div>
                <Button
                    onClick={() => toast({ title: "Thêm người dùng", description: "Chức năng đang phát triển" })}
                    style={{ backgroundColor: "var(--primary-blue)" }}
                    className="text-white"
                >
                    + Thêm người dùng
                </Button>
            </div>

            {/* Thong ke */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    title="Tổng người dùng"
                    value={statsData?.total ?? data?.meta?.total ?? 0}
                    colorVar="var(--primary-blue)"
                />
                <StatCard
                    title="Đang hoạt động"
                    value={statsData?.active ?? 0}
                    colorVar="var(--success)"
                />
                <StatCard
                    title="Vô hiệu hóa"
                    value={statsData?.inactive ?? 0}
                    colorVar="var(--error)"
                />
            </div>

            {/* Thong tin doanh nghiep */}
            {user?.doanh_nghiep && (
                <Card>
                    <CardHeader>
                        <CardTitle>Thông tin doanh nghiệp</CardTitle>
                        <CardDescription>Thông tin tenant hiện tại</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Tên doanh nghiệp</p>
                                <p className="font-medium">{user.doanh_nghiep.ten_doanh_nghiep}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Mã doanh nghiệp</p>
                                <p className="font-mono text-sm">{user.doanh_nghiep.ma_doanh_nghiep}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bang nguoi dung */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách người dùng</CardTitle>
                    <CardDescription>Quản lý tài khoản người dùng trong hệ thống</CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable
                        columns={columns}
                        data={data?.data || []}
                        pagination={pagination}
                        onPaginationChange={(newPage) => setPage(newPage)}
                        searchPlaceholder="Tìm kiếm người dùng..."
                        searchValue={search}
                        onSearchChange={setSearch}
                        isLoading={isLoading}
                        emptyMessage="Chưa có người dùng nào"
                        onEdit={handleEdit}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
