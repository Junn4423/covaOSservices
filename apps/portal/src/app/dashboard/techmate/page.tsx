/**
 * TechMate - Trang Quan ly Cong viec
 * Module TechMate - ServiceOS
 * 
 * Features:
 * - Hien thi danh sach cong viec
 * - Trang thai va uu tien voi Badge mau
 * - Tim kiem va phan trang
 * - Dialog xem chi tiet cong viec
 * - Giao dien 100% Tieng Viet co dau
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import httpClient, { type PaginatedResponse } from "@/lib/http";
import { DataTable, type DataTablePagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface CongViec {
    id: string;
    ma_cong_viec: string;
    tieu_de: string;
    mo_ta?: string;
    trang_thai: "moi" | "dang_lam" | "hoan_thanh" | "da_huy" | "pending" | "in_progress" | "completed" | "cancelled";
    do_uu_tien: "thap" | "trung_binh" | "cao" | "khan_cap" | "low" | "medium" | "high" | "urgent";
    ngay_bat_dau?: string;
    ngay_ket_thuc?: string;
    ngay_hen?: string;
    ngay_tao: string;
    dia_chi_lam_viec?: string;
    ghi_chu_noi_bo?: string;
    khach_hang?: {
        id: string;
        ho_ten: string;
        so_dien_thoai?: string;
        email?: string;
        dia_chi?: string;
    };
    nhan_vien?: {
        id: string;
        ho_ten: string;
        so_dien_thoai?: string;
    };
}

// ============================================================================
// CAU HINH TRANG THAI & UU TIEN
// ============================================================================

const TRANG_THAI_CONFIG: Record<string, { label: string; className: string }> = {
    moi: { label: "Moi", className: "bg-blue-100 text-blue-700" },
    dang_lam: { label: "Dang lam", className: "bg-yellow-100 text-yellow-700" },
    hoan_thanh: { label: "Hoan thanh", className: "bg-green-100 text-green-700" },
    da_huy: { label: "Da huy", className: "bg-red-100 text-red-700" },
    // Fallback cho API tieng Anh
    pending: { label: "Moi", className: "bg-blue-100 text-blue-700" },
    in_progress: { label: "Dang lam", className: "bg-yellow-100 text-yellow-700" },
    completed: { label: "Hoan thanh", className: "bg-green-100 text-green-700" },
    cancelled: { label: "Da huy", className: "bg-red-100 text-red-700" },
};

const UU_TIEN_CONFIG: Record<string, { label: string; className: string }> = {
    thap: { label: "Thap", className: "bg-gray-100 text-gray-600" },
    trung_binh: { label: "Trung binh", className: "bg-blue-50 text-blue-600" },
    cao: { label: "Cao", className: "bg-orange-100 text-orange-600" },
    khan_cap: { label: "Khan cap", className: "bg-red-100 text-red-600" },
    // Fallback cho API tieng Anh
    low: { label: "Thap", className: "bg-gray-100 text-gray-600" },
    medium: { label: "Trung binh", className: "bg-blue-50 text-blue-600" },
    high: { label: "Cao", className: "bg-orange-100 text-orange-600" },
    urgent: { label: "Khan cap", className: "bg-red-100 text-red-600" },
};

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
// DIALOG CHI TIET CONG VIEC
// ============================================================================

interface JobDetailDialogProps {
    job: CongViec | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function JobDetailDialog({ job, open, onOpenChange }: JobDetailDialogProps) {
    if (!job) return null;

    const statusConfig = TRANG_THAI_CONFIG[job.trang_thai] || TRANG_THAI_CONFIG.moi;
    const priorityConfig = UU_TIEN_CONFIG[job.do_uu_tien] || UU_TIEN_CONFIG.trung_binh;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "---";
        return new Date(dateStr).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl text-gray-900">
                        Chi tiet cong viec
                    </DialogTitle>
                    <DialogDescription>
                        Ma: {job.ma_cong_viec || `CV-${job.id.slice(0, 6).toUpperCase()}`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Tieu de va trang thai */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {job.tieu_de}
                        </h3>
                        <div className="flex gap-2">
                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", statusConfig.className)}>
                                {statusConfig.label}
                            </span>
                            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", priorityConfig.className)}>
                                {priorityConfig.label}
                            </span>
                        </div>
                    </div>

                    {/* Mo ta */}
                    {job.mo_ta && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Mo ta</p>
                            <p className="text-gray-700">{job.mo_ta}</p>
                        </div>
                    )}

                    {/* Thong tin khach hang */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-medium text-gray-500">Thong tin khach hang</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400">Ho ten</p>
                                <p className="font-medium text-gray-900">
                                    {job.khach_hang?.ho_ten || "---"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">So dien thoai</p>
                                <p className="text-gray-700">
                                    {job.khach_hang?.so_dien_thoai || "---"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Email</p>
                                <p className="text-gray-700">
                                    {job.khach_hang?.email || "---"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Dia chi</p>
                                <p className="text-gray-700">
                                    {job.khach_hang?.dia_chi || "---"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ky thuat vien */}
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-500">Ky thuat vien phu trach</p>
                        <p className="text-gray-700 font-medium">
                            {job.nhan_vien?.ho_ten || "Chua phan cong"}
                        </p>
                        {job.nhan_vien?.so_dien_thoai && (
                            <p className="text-sm text-gray-500">{job.nhan_vien.so_dien_thoai}</p>
                        )}
                    </div>

                    {/* Thoi gian */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Ngay tao</p>
                            <p className="text-gray-700">{formatDate(job.ngay_tao)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Ngay hen</p>
                            <p className="text-gray-700">{formatDate(job.ngay_hen)}</p>
                        </div>
                    </div>

                    {/* Dia chi lam viec */}
                    {job.dia_chi_lam_viec && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Dia chi lam viec</p>
                            <p className="text-gray-700">{job.dia_chi_lam_viec}</p>
                        </div>
                    )}

                    {/* Ghi chu */}
                    {job.ghi_chu_noi_bo && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-gray-500">Ghi chu noi bo</p>
                            <p className="text-gray-700">{job.ghi_chu_noi_bo}</p>
                        </div>
                    )}
                </div>

                {/* Nut dong */}
                <div className="flex justify-end mt-6">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Dong
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// TRANG TECHMATE - QUAN LY CONG VIEC
// ============================================================================

export default function TechMatePage() {
    const { toast } = useToast();

    // State phan trang va tim kiem
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState("");

    // State Dialog chi tiet
    const [selectedJob, setSelectedJob] = useState<CongViec | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    // Lay danh sach cong viec
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["techmate-cong-viec", { page, limit, search }],
        queryFn: async () => {
            // Thu goi API TechMate truoc
            try {
                const response = await httpClient.get<PaginatedResponse<CongViec>>("/techmate/cong-viec", {
                    params: { page, limit, search: search || undefined },
                });
                return response.data;
            } catch {
                // Fallback sang endpoint /jobs neu khong co
                const response = await httpClient.get<PaginatedResponse<CongViec>>("/jobs", {
                    params: { page, limit, search: search || undefined },
                });
                return response.data;
            }
        },
        staleTime: 5 * 60 * 1000,
    });

    // Dinh nghia cot voi nut Chi tiet
    const columns: ColumnDef<CongViec>[] = useMemo(() => [
        {
            accessorKey: "ma_cong_viec",
            header: "Ma CV",
            cell: ({ row }) => (
                <span
                    className="font-mono text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: "var(--gray-100)", color: "var(--gray-700)" }}
                >
                    {row.original.ma_cong_viec || `CV-${row.original.id.slice(0, 6).toUpperCase()}`}
                </span>
            ),
        },
        {
            accessorKey: "tieu_de",
            header: "Tieu de",
            cell: ({ row }) => (
                <div className="max-w-xs">
                    <p className="font-medium text-gray-900 truncate">
                        {row.original.tieu_de}
                    </p>
                    {row.original.mo_ta && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                            {row.original.mo_ta}
                        </p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "khach_hang",
            header: "Khach hang",
            cell: ({ row }) => (
                <div>
                    <p className="text-gray-700">
                        {row.original.khach_hang?.ho_ten || "---"}
                    </p>
                    {row.original.khach_hang?.so_dien_thoai && (
                        <p className="text-xs text-gray-500">
                            {row.original.khach_hang.so_dien_thoai}
                        </p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "nhan_vien",
            header: "Ky thuat vien",
            cell: ({ row }) => (
                <span className="text-gray-600">
                    {row.original.nhan_vien?.ho_ten || "Chua phan cong"}
                </span>
            ),
        },
        {
            accessorKey: "trang_thai",
            header: "Trang thai",
            cell: ({ row }) => {
                const status = row.original.trang_thai;
                const config = TRANG_THAI_CONFIG[status] || TRANG_THAI_CONFIG.moi;
                return (
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", config.className)}>
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
                const config = UU_TIEN_CONFIG[priority] || UU_TIEN_CONFIG.trung_binh;
                return (
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", config.className)}>
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
        {
            id: "actions",
            header: "Thao tac",
            cell: ({ row }) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setSelectedJob(row.original);
                        setIsDetailOpen(true);
                    }}
                    className="text-xs"
                >
                    Chi tiet
                </Button>
            ),
        },
    ], []);

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

    const handleEdit = useCallback((job: CongViec) => {
        toast({
            title: "Chinh sua cong viec",
            description: `Dang mo chinh sua: ${job.tieu_de}`,
        });
    }, [toast]);

    const handleDelete = useCallback((job: CongViec) => {
        toast({
            title: "Xoa cong viec",
            description: `Xac nhan xoa: ${job.tieu_de}?`,
            variant: "destructive",
        });
    }, [toast]);

    // Tinh toan thong ke
    const stats = useMemo(() => {
        if (!data?.data) return { moi: 0, dangLam: 0, hoanThanh: 0, total: 0 };

        const jobs = data.data;
        return {
            moi: jobs.filter((j) => j.trang_thai === "moi" || j.trang_thai === "pending").length,
            dangLam: jobs.filter((j) => j.trang_thai === "dang_lam" || j.trang_thai === "in_progress").length,
            hoanThanh: jobs.filter((j) => j.trang_thai === "hoan_thanh" || j.trang_thai === "completed").length,
            total: data.meta?.total || jobs.length,
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
                        {(error as Error)?.message || "Khong the tai danh sach cong viec"}
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
                        Quan ly cong viec
                    </h1>
                    <p className="mt-1 text-gray-500">
                        TechMate - Tao, phan cong va theo doi cong viec
                    </p>
                </div>
                <Button
                    onClick={() => toast({ title: "Tao cong viec moi", description: "Tinh nang dang phat trien" })}
                    style={{
                        backgroundColor: "var(--primary-dark)",
                        boxShadow: "0 4px 14px rgba(18, 78, 102, 0.25)"
                    }}
                    className="text-white hover:brightness-110"
                >
                    + Tao cong viec
                </Button>
            </div>

            {/* The thong ke */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Tong cong viec"
                    value={stats.total}
                    colorVar="var(--primary-dark)"
                />
                <StatCard
                    title="Moi"
                    value={stats.moi}
                    colorVar="#3B82F6"
                />
                <StatCard
                    title="Dang lam"
                    value={stats.dangLam}
                    colorVar="#F59E0B"
                />
                <StatCard
                    title="Hoan thanh"
                    value={stats.hoanThanh}
                    colorVar="#22C55E"
                />
            </div>

            {/* Bang du lieu */}
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
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </CardContent>
            </Card>

            {/* Dialog chi tiet */}
            <JobDetailDialog
                job={selectedJob}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />
        </div>
    );
}

