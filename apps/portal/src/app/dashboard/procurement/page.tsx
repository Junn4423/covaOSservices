/**
 * Procurement - Trang Mua hang NCC
 * Module ProcurePool - ServiceOS
 * 
 * Features:
 * - Quan ly nha cung cap
 * - Dat hang
 * - Nhap kho
 * - Cong no
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

interface NhaCungCap {
    id: string;
    ma_ncc: string;
    ten_ncc: string;
    nguoi_lien_he?: string;
    so_dien_thoai?: string;
    email?: string;
    dia_chi?: string;
    cong_no: number;
    trang_thai: "active" | "inactive";
    ngay_tao: string;
}

interface DonDatHang {
    id: string;
    ma_don_hang: string;
    nha_cung_cap?: {
        ten_ncc: string;
    };
    tong_gia_tri: number;
    trang_thai: "draft" | "pending" | "confirmed" | "shipping" | "received" | "cancelled";
    ngay_dat_hang: string;
    ngay_du_kien_nhan?: string;
    ngay_tao: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const TRANG_THAI_NCC: Record<string, { label: string; className: string }> = {
    active: { label: "Hoạt động", className: "bg-green-100 text-green-700" },
    inactive: { label: "Ngừng HĐ", className: "bg-gray-100 text-gray-700" },
};

const TRANG_THAI_DON: Record<string, { label: string; className: string }> = {
    draft: { label: "Nháp", className: "bg-gray-100 text-gray-700" },
    pending: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-700" },
    confirmed: { label: "Đã xác nhận", className: "bg-blue-100 text-blue-700" },
    shipping: { label: "Đang giao", className: "bg-purple-100 text-purple-700" },
    received: { label: "Đã nhận", className: "bg-green-100 text-green-700" },
    cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
};

// ============================================================================
// COLUMNS
// ============================================================================

const nccColumns: ColumnDef<NhaCungCap>[] = [
    {
        accessorKey: "ma_ncc",
        header: "Mã NCC",
        cell: ({ row }) => (
            <span className="font-mono text-sm font-medium text-blue-600">
                {row.original.ma_ncc}
            </span>
        ),
    },
    {
        accessorKey: "ten_ncc",
        header: "Tên nhà cung cấp",
        cell: ({ row }) => (
            <div className="max-w-xs">
                <p className="font-medium text-gray-900 truncate">{row.original.ten_ncc}</p>
                <p className="text-xs text-gray-500">{row.original.nguoi_lien_he}</p>
            </div>
        ),
    },
    {
        accessorKey: "so_dien_thoai",
        header: "Liên hệ",
        cell: ({ row }) => (
            <div>
                <p className="text-sm">{row.original.so_dien_thoai || "---"}</p>
                <p className="text-xs text-gray-500">{row.original.email}</p>
            </div>
        ),
    },
    {
        accessorKey: "cong_no",
        header: "Công nợ",
        cell: ({ row }) => (
            <span className={cn(
                "font-medium",
                row.original.cong_no > 0 ? "text-red-600" : "text-gray-600"
            )}>
                {row.original.cong_no?.toLocaleString("vi-VN")} đ
            </span>
        ),
    },
    {
        accessorKey: "trang_thai",
        header: "Trạng thái",
        cell: ({ row }) => {
            const config = TRANG_THAI_NCC[row.original.trang_thai] || TRANG_THAI_NCC.active;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
                    {config.label}
                </span>
            );
        },
    },
];

const donHangColumns: ColumnDef<DonDatHang>[] = [
    {
        accessorKey: "ma_don_hang",
        header: "Mã đơn hàng",
        cell: ({ row }) => (
            <span className="font-mono text-sm font-medium text-green-600">
                {row.original.ma_don_hang}
            </span>
        ),
    },
    {
        accessorKey: "nha_cung_cap",
        header: "Nhà cung cấp",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.nha_cung_cap?.ten_ncc || "---"}
            </span>
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
        accessorKey: "ngay_dat_hang",
        header: "Ngày đặt",
        cell: ({ row }) => {
            const date = row.original.ngay_dat_hang;
            if (!date) return "---";
            return new Date(date).toLocaleDateString("vi-VN");
        },
    },
    {
        accessorKey: "ngay_du_kien_nhan",
        header: "Dự kiến nhận",
        cell: ({ row }) => {
            const date = row.original.ngay_du_kien_nhan;
            if (!date) return "---";
            return new Date(date).toLocaleDateString("vi-VN");
        },
    },
    {
        accessorKey: "trang_thai",
        header: "Trạng thái",
        cell: ({ row }) => {
            const config = TRANG_THAI_DON[row.original.trang_thai] || TRANG_THAI_DON.draft;
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

export default function ProcurementPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("ncc");
    const [nccPage, setNccPage] = useState(1);
    const [donHangPage, setDonHangPage] = useState(1);
    const limit = 10;

    // Fetch NCC
    const nccQuery = useQuery({
        queryKey: ["procurement", "ncc", nccPage, limit],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<NhaCungCap>>("/procurement/nha-cung-cap", {
                params: { page: nccPage, limit },
            });
            return response.data;
        },
        enabled: activeTab === "ncc",
    });

    // Fetch don hang
    const donHangQuery = useQuery({
        queryKey: ["procurement", "don-hang", donHangPage, limit],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<DonDatHang>>("/procurement/don-dat-hang", {
                params: { page: donHangPage, limit },
            });
            return response.data;
        },
        enabled: activeTab === "don-hang",
    });

    const nccPagination: DataTablePagination | undefined = nccQuery.data?.meta ? {
        page: nccQuery.data.meta.page,
        limit: nccQuery.data.meta.limit,
        total: nccQuery.data.meta.total,
        totalPages: nccQuery.data.meta.totalPages,
    } : undefined;

    const donHangPagination: DataTablePagination | undefined = donHangQuery.data?.meta ? {
        page: donHangQuery.data.meta.page,
        limit: donHangQuery.data.meta.limit,
        total: donHangQuery.data.meta.total,
        totalPages: donHangQuery.data.meta.totalPages,
    } : undefined;

    // Mock totals
    const tongCongNo = 45000000;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mua hàng NCC</h1>
                    <p className="text-gray-500 mt-1">Quản lý nhà cung cấp và đơn đặt hàng</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => toast({ title: "Thêm NCC", description: "Đang phát triển" })}
                    >
                        + Thêm NCC
                    </Button>
                    <Button
                        onClick={() => toast({ title: "Tạo đơn hàng", description: "Đang phát triển" })}
                        style={{ backgroundColor: "var(--primary-blue)" }}
                        className="text-white"
                    >
                        + Đặt hàng
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard 
                    title="Tổng NCC" 
                    value={nccQuery.data?.meta?.total ?? 0} 
                    colorVar="var(--primary-blue)" 
                />
                <StatCard 
                    title="Đơn hàng tháng này" 
                    value={donHangQuery.data?.meta?.total ?? 0} 
                    colorVar="var(--success)" 
                />
                <StatCard title="Đang vận chuyển" value={0} colorVar="#8B5CF6" />
                <StatCard 
                    title="Tổng công nợ" 
                    value={`${(tongCongNo / 1000000).toFixed(0)}M`} 
                    colorVar="#EF4444" 
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-100">
                    <TabsTrigger value="ncc">Nhà cung cấp</TabsTrigger>
                    <TabsTrigger value="don-hang">Đơn đặt hàng</TabsTrigger>
                    <TabsTrigger value="cong-no">Công nợ</TabsTrigger>
                </TabsList>

                <TabsContent value="ncc" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách nhà cung cấp</CardTitle>
                            <CardDescription>Quản lý thông tin nhà cung cấp</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={nccColumns}
                                data={nccQuery.data?.data || []}
                                pagination={nccPagination}
                                onPaginationChange={(newPage) => setNccPage(newPage)}
                                isLoading={nccQuery.isLoading}
                                emptyMessage="Chưa có nhà cung cấp nào"
                                onEdit={(row) => toast({ title: "Xem NCC", description: row.ten_ncc })}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="don-hang" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách đơn đặt hàng</CardTitle>
                            <CardDescription>Quản lý và theo dõi đơn hàng từ NCC</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={donHangColumns}
                                data={donHangQuery.data?.data || []}
                                pagination={donHangPagination}
                                onPaginationChange={(newPage) => setDonHangPage(newPage)}
                                isLoading={donHangQuery.isLoading}
                                emptyMessage="Chưa có đơn hàng nào"
                                onEdit={(row) => toast({ title: "Xem đơn hàng", description: row.ma_don_hang })}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cong-no" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quản lý công nợ</CardTitle>
                            <CardDescription>Theo dõi công nợ với nhà cung cấp</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">💰</span>
                                    </div>
                                    <p className="text-gray-500">Báo cáo công nợ sẽ hiển thị tại đây</p>
                                    <p className="text-xs text-gray-400 mt-1">Đang phát triển...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
