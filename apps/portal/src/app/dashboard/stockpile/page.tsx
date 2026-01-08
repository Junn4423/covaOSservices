/**
 * StockPile - Trang Quan ly Kho va San pham
 * Module StockPile - ServiceOS
 * 
 * Features:
 * - Tab San pham va Ton kho
 * - Hien thi danh sach san pham voi SKU va gia
 * - Hien thi ton kho theo tung kho
 * - Tim kiem va phan trang
 * - Giao dien 100% Tieng Viet
 */

"use client";

import { useState, useCallback } from "react";
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
    anh_dai_dien?: string;
    nhom_san_pham?: {
        id: string;
        ten_nhom: string;
    };
    ngay_tao: string;
}

interface TonKho {
    id: string;
    san_pham: {
        id: string;
        ten_san_pham: string;
        ma_sku: string;
    };
    kho: {
        id: string;
        ten_kho: string;
        dia_chi?: string;
    };
    so_luong: number;
    so_luong_dat_truoc?: number;
    so_luong_kha_dung?: number;
    ngay_cap_nhat: string;
}

// ============================================================================
// DINH DANG TIEN TE
// ============================================================================

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);
}

// ============================================================================
// DINH NGHIA COT - SAN PHAM
// ============================================================================

const sanPhamColumns: ColumnDef<SanPham>[] = [
    {
        accessorKey: "ma_sku",
        header: "Ma SKU",
        cell: ({ row }) => (
            <span
                className="font-mono text-xs px-2 py-1 rounded bg-gray-100 text-gray-700"
            >
                {row.original.ma_sku || "---"}
            </span>
        ),
    },
    {
        accessorKey: "ten_san_pham",
        header: "Ten san pham",
        cell: ({ row }) => (
            <div className="max-w-xs">
                <p className="font-medium text-gray-900 truncate">
                    {row.original.ten_san_pham}
                </p>
                {row.original.nhom_san_pham && (
                    <p className="text-xs text-gray-500">
                        {row.original.nhom_san_pham.ten_nhom}
                    </p>
                )}
            </div>
        ),
    },
    {
        accessorKey: "don_vi_tinh",
        header: "Don vi",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.don_vi_tinh || "Cai"}
            </span>
        ),
    },
    {
        accessorKey: "gia_nhap",
        header: "Gia nhap",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.gia_nhap ? formatCurrency(row.original.gia_nhap) : "---"}
            </span>
        ),
    },
    {
        accessorKey: "gia_ban",
        header: "Gia ban",
        cell: ({ row }) => (
            <span className="font-semibold text-green-600">
                {formatCurrency(row.original.gia_ban)}
            </span>
        ),
    },
    {
        accessorKey: "trang_thai",
        header: "Trang thai",
        cell: ({ row }) => {
            const isActive = row.original.trang_thai === 1;
            return (
                <span className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium",
                    isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                )}>
                    {isActive ? "Dang ban" : "Ngung ban"}
                </span>
            );
        },
    },
];

// ============================================================================
// DINH NGHIA COT - TON KHO
// ============================================================================

const tonKhoColumns: ColumnDef<TonKho>[] = [
    {
        accessorKey: "kho",
        header: "Kho",
        cell: ({ row }) => (
            <div>
                <p className="font-medium text-gray-900">
                    {row.original.kho?.ten_kho || "---"}
                </p>
                {row.original.kho?.dia_chi && (
                    <p className="text-xs text-gray-500 truncate max-w-xs">
                        {row.original.kho.dia_chi}
                    </p>
                )}
            </div>
        ),
    },
    {
        accessorKey: "san_pham",
        header: "San pham",
        cell: ({ row }) => (
            <div>
                <p className="font-medium text-gray-900">
                    {row.original.san_pham?.ten_san_pham || "---"}
                </p>
                <p className="text-xs text-gray-500 font-mono">
                    {row.original.san_pham?.ma_sku}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "so_luong",
        header: "Tong ton",
        cell: ({ row }) => (
            <span className={cn(
                "font-semibold",
                row.original.so_luong <= 0 ? "text-red-600" :
                    row.original.so_luong < 10 ? "text-orange-600" : "text-gray-900"
            )}>
                {row.original.so_luong.toLocaleString('vi-VN')}
            </span>
        ),
    },
    {
        accessorKey: "so_luong_dat_truoc",
        header: "Dat truoc",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {(row.original.so_luong_dat_truoc || 0).toLocaleString('vi-VN')}
            </span>
        ),
    },
    {
        accessorKey: "so_luong_kha_dung",
        header: "Kha dung",
        cell: ({ row }) => {
            const khaDung = row.original.so_luong_kha_dung ??
                (row.original.so_luong - (row.original.so_luong_dat_truoc || 0));
            return (
                <span className={cn(
                    "font-semibold",
                    khaDung <= 0 ? "text-red-600" : "text-green-600"
                )}>
                    {khaDung.toLocaleString('vi-VN')}
                </span>
            );
        },
    },
    {
        accessorKey: "ngay_cap_nhat",
        header: "Cap nhat",
        cell: ({ row }) => {
            const date = row.original.ngay_cap_nhat;
            if (!date) return "---";
            return new Date(date).toLocaleDateString("vi-VN");
        },
    },
];

// ============================================================================
// COMPONENT TAB
// ============================================================================

interface TabProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

function Tab({ active, onClick, children }: TabProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                active
                    ? "bg-white text-gray-900 border-t border-l border-r border-gray-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
        >
            {children}
        </button>
    );
}

// ============================================================================
// TRANG STOCKPILE - QUAN LY KHO
// ============================================================================

export default function StockPilePage() {
    const { toast } = useToast();

    // State tab
    const [activeTab, setActiveTab] = useState<"san-pham" | "ton-kho">("san-pham");

    // State phan trang
    const [spPage, setSpPage] = useState(1);
    const [tkPage, setTkPage] = useState(1);
    const [spSearch, setSpSearch] = useState("");
    const [tkSearch, setTkSearch] = useState("");
    const limit = 10;

    // Query san pham
    const sanPhamQuery = useQuery({
        queryKey: ["stockpile-san-pham", { page: spPage, limit, search: spSearch }],
        queryFn: async () => {
            try {
                const response = await httpClient.get<PaginatedResponse<SanPham>>("/stockpile/san-pham", {
                    params: { page: spPage, limit, search: spSearch || undefined },
                });
                return response.data;
            } catch {
                // Fallback
                const response = await httpClient.get<PaginatedResponse<SanPham>>("/products", {
                    params: { page: spPage, limit, search: spSearch || undefined },
                });
                return response.data;
            }
        },
        enabled: activeTab === "san-pham",
        staleTime: 5 * 60 * 1000,
    });

    // Query ton kho
    const tonKhoQuery = useQuery({
        queryKey: ["stockpile-ton-kho", { page: tkPage, limit, search: tkSearch }],
        queryFn: async () => {
            try {
                const response = await httpClient.get<PaginatedResponse<TonKho>>("/stockpile/ton-kho", {
                    params: { page: tkPage, limit, search: tkSearch || undefined },
                });
                return response.data;
            } catch {
                // Fallback
                const response = await httpClient.get<PaginatedResponse<TonKho>>("/inventory", {
                    params: { page: tkPage, limit, search: tkSearch || undefined },
                });
                return response.data;
            }
        },
        enabled: activeTab === "ton-kho",
        staleTime: 5 * 60 * 1000,
    });

    // Handlers
    const handleSpPageChange = useCallback((newPage: number) => setSpPage(newPage), []);
    const handleTkPageChange = useCallback((newPage: number) => setTkPage(newPage), []);
    const handleSpSearchChange = useCallback((value: string) => { setSpSearch(value); setSpPage(1); }, []);
    const handleTkSearchChange = useCallback((value: string) => { setTkSearch(value); setTkPage(1); }, []);

    const handleEditSanPham = useCallback((sp: SanPham) => {
        toast({ title: "Chinh sua san pham", description: `Dang mo: ${sp.ten_san_pham}` });
    }, [toast]);

    const handleDeleteSanPham = useCallback((sp: SanPham) => {
        toast({ title: "Xoa san pham", description: `Xac nhan xoa: ${sp.ten_san_pham}?`, variant: "destructive" });
    }, [toast]);

    // Pagination data
    const spPagination: DataTablePagination | undefined = sanPhamQuery.data?.meta
        ? {
            page: sanPhamQuery.data.meta.page, limit: sanPhamQuery.data.meta.limit,
            total: sanPhamQuery.data.meta.total, totalPages: sanPhamQuery.data.meta.totalPages
        }
        : undefined;

    const tkPagination: DataTablePagination | undefined = tonKhoQuery.data?.meta
        ? {
            page: tonKhoQuery.data.meta.page, limit: tonKhoQuery.data.meta.limit,
            total: tonKhoQuery.data.meta.total, totalPages: tonKhoQuery.data.meta.totalPages
        }
        : undefined;

    return (
        <div className="space-y-6">
            {/* Tieu de trang */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Quan ly kho hang
                    </h1>
                    <p className="mt-1 text-gray-500">
                        StockPile - Quan ly san pham va ton kho
                    </p>
                </div>
                <Button
                    onClick={() => toast({ title: "Them san pham", description: "Tinh nang dang phat trien" })}
                    style={{
                        backgroundColor: "var(--primary-dark)",
                        boxShadow: "0 4px 14px rgba(18, 78, 102, 0.25)"
                    }}
                    className="text-white hover:brightness-110"
                >
                    + Them san pham
                </Button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex gap-1">
                    <Tab active={activeTab === "san-pham"} onClick={() => setActiveTab("san-pham")}>
                        San pham
                    </Tab>
                    <Tab active={activeTab === "ton-kho"} onClick={() => setActiveTab("ton-kho")}>
                        Ton kho
                    </Tab>
                </div>
            </div>

            {/* Noi dung Tab */}
            {activeTab === "san-pham" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Danh sach san pham</CardTitle>
                        <CardDescription>
                            Quan ly tat ca san pham trong he thong
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={sanPhamColumns}
                            data={sanPhamQuery.data?.data || []}
                            pagination={spPagination}
                            onPaginationChange={handleSpPageChange}
                            searchPlaceholder="Tim kiem san pham..."
                            searchValue={spSearch}
                            onSearchChange={handleSpSearchChange}
                            isLoading={sanPhamQuery.isLoading}
                            emptyMessage="Chua co san pham nao"
                            onEdit={handleEditSanPham}
                            onDelete={handleDeleteSanPham}
                        />
                    </CardContent>
                </Card>
            )}

            {activeTab === "ton-kho" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ton kho theo vi tri</CardTitle>
                        <CardDescription>
                            Theo doi so luong ton kho tai cac kho hang
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            columns={tonKhoColumns}
                            data={tonKhoQuery.data?.data || []}
                            pagination={tkPagination}
                            onPaginationChange={handleTkPageChange}
                            searchPlaceholder="Tim kiem ton kho..."
                            searchValue={tkSearch}
                            onSearchChange={handleTkSearchChange}
                            isLoading={tonKhoQuery.isLoading}
                            emptyMessage="Chua co du lieu ton kho"
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

