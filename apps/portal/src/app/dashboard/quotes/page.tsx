/**
 * Quotes - Trang Bao gia & Hop dong
 * Module QuoteMaster - ServiceOS
 * 
 * Features:
 * - Quan ly bao gia
 * - Quan ly hop dong
 * - Template bao gia
 * - Duyet bao gia
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

interface BaoGia {
    id: string;
    ma_bao_gia: string;
    ten_bao_gia: string;
    khach_hang?: {
        ten_cong_ty: string;
        nguoi_dai_dien: string;
    };
    tong_gia_tri: number;
    trang_thai: "draft" | "pending" | "approved" | "rejected" | "expired";
    ngay_hieu_luc?: string;
    ngay_het_han?: string;
    ngay_tao: string;
}

interface HopDong {
    id: string;
    ma_hop_dong: string;
    ten_hop_dong: string;
    khach_hang?: {
        ten_cong_ty: string;
    };
    gia_tri_hop_dong: number;
    trang_thai: "draft" | "active" | "suspended" | "terminated" | "expired";
    ngay_bat_dau?: string;
    ngay_ket_thuc?: string;
    ngay_tao: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const TRANG_THAI_BAO_GIA: Record<string, { label: string; className: string }> = {
    draft: { label: "Nháp", className: "bg-gray-100 text-gray-700" },
    pending: { label: "Chờ duyệt", className: "bg-yellow-100 text-yellow-700" },
    approved: { label: "Đã duyệt", className: "bg-green-100 text-green-700" },
    rejected: { label: "Từ chối", className: "bg-red-100 text-red-700" },
    expired: { label: "Hết hạn", className: "bg-orange-100 text-orange-700" },
};

const TRANG_THAI_HOP_DONG: Record<string, { label: string; className: string }> = {
    draft: { label: "Nháp", className: "bg-gray-100 text-gray-700" },
    active: { label: "Đang hiệu lực", className: "bg-green-100 text-green-700" },
    suspended: { label: "Tạm dừng", className: "bg-yellow-100 text-yellow-700" },
    terminated: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
    expired: { label: "Hết hạn", className: "bg-orange-100 text-orange-700" },
};

// ============================================================================
// COLUMNS
// ============================================================================

const baoGiaColumns: ColumnDef<BaoGia>[] = [
    {
        accessorKey: "ma_bao_gia",
        header: "Mã báo giá",
        cell: ({ row }) => (
            <span className="font-mono text-sm font-medium text-blue-600">
                {row.original.ma_bao_gia}
            </span>
        ),
    },
    {
        accessorKey: "ten_bao_gia",
        header: "Tên báo giá",
        cell: ({ row }) => (
            <div className="max-w-xs">
                <p className="font-medium text-gray-900 truncate">{row.original.ten_bao_gia}</p>
            </div>
        ),
    },
    {
        accessorKey: "khach_hang",
        header: "Khách hàng",
        cell: ({ row }) => (
            <div>
                <p className="font-medium">{row.original.khach_hang?.ten_cong_ty || "---"}</p>
                <p className="text-xs text-gray-500">{row.original.khach_hang?.nguoi_dai_dien}</p>
            </div>
        ),
    },
    {
        accessorKey: "tong_gia_tri",
        header: "Giá trị",
        cell: ({ row }) => (
            <span className="font-medium text-gray-900">
                {row.original.tong_gia_tri?.toLocaleString("vi-VN")} đ
            </span>
        ),
    },
    {
        accessorKey: "ngay_het_han",
        header: "Ngày hết hạn",
        cell: ({ row }) => {
            const date = row.original.ngay_het_han;
            if (!date) return "---";
            return new Date(date).toLocaleDateString("vi-VN");
        },
    },
    {
        accessorKey: "trang_thai",
        header: "Trạng thái",
        cell: ({ row }) => {
            const config = TRANG_THAI_BAO_GIA[row.original.trang_thai] || TRANG_THAI_BAO_GIA.draft;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
                    {config.label}
                </span>
            );
        },
    },
];

const hopDongColumns: ColumnDef<HopDong>[] = [
    {
        accessorKey: "ma_hop_dong",
        header: "Mã hợp đồng",
        cell: ({ row }) => (
            <span className="font-mono text-sm font-medium text-green-600">
                {row.original.ma_hop_dong}
            </span>
        ),
    },
    {
        accessorKey: "ten_hop_dong",
        header: "Tên hợp đồng",
        cell: ({ row }) => (
            <div className="max-w-xs">
                <p className="font-medium text-gray-900 truncate">{row.original.ten_hop_dong}</p>
            </div>
        ),
    },
    {
        accessorKey: "khach_hang",
        header: "Khách hàng",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.khach_hang?.ten_cong_ty || "---"}
            </span>
        ),
    },
    {
        accessorKey: "gia_tri_hop_dong",
        header: "Giá trị",
        cell: ({ row }) => (
            <span className="font-medium text-gray-900">
                {row.original.gia_tri_hop_dong?.toLocaleString("vi-VN")} đ
            </span>
        ),
    },
    {
        accessorKey: "ngay_ket_thuc",
        header: "Ngày kết thúc",
        cell: ({ row }) => {
            const date = row.original.ngay_ket_thuc;
            if (!date) return "Không xác định";
            return new Date(date).toLocaleDateString("vi-VN");
        },
    },
    {
        accessorKey: "trang_thai",
        header: "Trạng thái",
        cell: ({ row }) => {
            const config = TRANG_THAI_HOP_DONG[row.original.trang_thai] || TRANG_THAI_HOP_DONG.draft;
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
// PAGE
// ============================================================================

export default function QuotesPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("bao-gia");
    const [baoGiaPage, setBaoGiaPage] = useState(1);
    const [hopDongPage, setHopDongPage] = useState(1);
    const limit = 10;

    // Fetch bao gia
    const baoGiaQuery = useQuery({
        queryKey: ["bao-gia", baoGiaPage, limit],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<BaoGia>>("/bao-gia", {
                params: { page: baoGiaPage, limit },
            });
            return response.data;
        },
        enabled: activeTab === "bao-gia",
    });

    // Fetch hop dong
    const hopDongQuery = useQuery({
        queryKey: ["hop-dong", hopDongPage, limit],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<HopDong>>("/hop-dong", {
                params: { page: hopDongPage, limit },
            });
            return response.data;
        },
        enabled: activeTab === "hop-dong",
    });

    const baoGiaPagination: DataTablePagination | undefined = baoGiaQuery.data?.meta ? {
        page: baoGiaQuery.data.meta.page,
        limit: baoGiaQuery.data.meta.limit,
        total: baoGiaQuery.data.meta.total,
        totalPages: baoGiaQuery.data.meta.totalPages,
    } : undefined;

    const hopDongPagination: DataTablePagination | undefined = hopDongQuery.data?.meta ? {
        page: hopDongQuery.data.meta.page,
        limit: hopDongQuery.data.meta.limit,
        total: hopDongQuery.data.meta.total,
        totalPages: hopDongQuery.data.meta.totalPages,
    } : undefined;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Báo giá & Hợp đồng</h1>
                    <p className="text-gray-500 mt-1">Quản lý báo giá và hợp đồng với khách hàng</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => toast({ title: "Tạo hợp đồng", description: "Đang phát triển" })}
                    >
                        + Hợp đồng mới
                    </Button>
                    <Button
                        onClick={() => toast({ title: "Tạo báo giá", description: "Đang phát triển" })}
                        style={{ backgroundColor: "var(--primary-blue)" }}
                        className="text-white"
                    >
                        + Báo giá mới
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard 
                    title="Tổng báo giá" 
                    value={baoGiaQuery.data?.meta?.total ?? 0} 
                    colorVar="var(--primary-blue)" 
                />
                <StatCard title="Chờ duyệt" value={0} colorVar="#F59E0B" />
                <StatCard 
                    title="Tổng hợp đồng" 
                    value={hopDongQuery.data?.meta?.total ?? 0} 
                    colorVar="var(--success)" 
                />
                <StatCard title="Sắp hết hạn" value={0} colorVar="#EF4444" />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-100">
                    <TabsTrigger value="bao-gia">Báo giá</TabsTrigger>
                    <TabsTrigger value="hop-dong">Hợp đồng</TabsTrigger>
                </TabsList>

                <TabsContent value="bao-gia" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách báo giá</CardTitle>
                            <CardDescription>Quản lý và theo dõi các báo giá</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={baoGiaColumns}
                                data={baoGiaQuery.data?.data || []}
                                pagination={baoGiaPagination}
                                onPaginationChange={(newPage) => setBaoGiaPage(newPage)}
                                isLoading={baoGiaQuery.isLoading}
                                emptyMessage="Chưa có báo giá nào"
                                onEdit={(row) => toast({ title: "Xem báo giá", description: row.ma_bao_gia })}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="hop-dong" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách hợp đồng</CardTitle>
                            <CardDescription>Quản lý và theo dõi các hợp đồng</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={hopDongColumns}
                                data={hopDongQuery.data?.data || []}
                                pagination={hopDongPagination}
                                onPaginationChange={(newPage) => setHopDongPage(newPage)}
                                isLoading={hopDongQuery.isLoading}
                                emptyMessage="Chưa có hợp đồng nào"
                                onEdit={(row) => toast({ title: "Xem hợp đồng", description: row.ma_hop_dong })}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
