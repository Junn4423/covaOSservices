/**
 * Billing - Trang Goi cuoc & Thanh toan
 * Module SaaS Billing - ServiceOS
 * 
 * Features:
 * - Thong tin goi cuoc
 * - Lich su thanh toan
 * - Nang cap goi
 * - Hoa don
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

interface GoiCuoc {
    id: string;
    ten_goi: string;
    gia: number;
    chu_ky: "monthly" | "yearly";
    tinh_nang: string[];
    gioi_han_user?: number;
    gioi_han_storage?: number;
}

interface Subscription {
    id: string;
    goi_cuoc: GoiCuoc;
    ngay_bat_dau: string;
    ngay_ket_thuc: string;
    trang_thai: "active" | "expired" | "cancelled" | "pending";
    so_user_da_dung: number;
    storage_da_dung: number;
}

interface LichSuThanhToan {
    id: string;
    ma_giao_dich: string;
    so_tien: number;
    phuong_thuc: "bank_transfer" | "credit_card" | "momo" | "vnpay";
    trang_thai: "pending" | "completed" | "failed" | "refunded";
    mo_ta?: string;
    ngay_thanh_toan: string;
}

// ============================================================================
// CONFIG
// ============================================================================

const TRANG_THAI_GD: Record<string, { label: string; className: string }> = {
    pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-700" },
    completed: { label: "Thành công", className: "bg-green-100 text-green-700" },
    failed: { label: "Thất bại", className: "bg-red-100 text-red-700" },
    refunded: { label: "Hoàn tiền", className: "bg-purple-100 text-purple-700" },
};

const PHUONG_THUC: Record<string, string> = {
    bank_transfer: "Chuyển khoản",
    credit_card: "Thẻ tín dụng",
    momo: "MoMo",
    vnpay: "VNPay",
};

const GOI_CUOC_DATA: GoiCuoc[] = [
    {
        id: "1",
        ten_goi: "Starter",
        gia: 0,
        chu_ky: "monthly",
        tinh_nang: ["3 người dùng", "1GB lưu trữ", "Hỗ trợ email"],
        gioi_han_user: 3,
        gioi_han_storage: 1024,
    },
    {
        id: "2",
        ten_goi: "Professional",
        gia: 990000,
        chu_ky: "monthly",
        tinh_nang: ["10 người dùng", "10GB lưu trữ", "Hỗ trợ ưu tiên", "API access", "Báo cáo nâng cao"],
        gioi_han_user: 10,
        gioi_han_storage: 10240,
    },
    {
        id: "3",
        ten_goi: "Enterprise",
        gia: 2990000,
        chu_ky: "monthly",
        tinh_nang: ["Không giới hạn user", "100GB lưu trữ", "Hỗ trợ 24/7", "API access", "Custom integrations", "SSO"],
        gioi_han_user: undefined,
        gioi_han_storage: 102400,
    },
];

// ============================================================================
// COLUMNS
// ============================================================================

const lichSuColumns: ColumnDef<LichSuThanhToan>[] = [
    {
        accessorKey: "ma_giao_dich",
        header: "Mã GD",
        cell: ({ row }) => (
            <span className="font-mono text-sm font-medium text-blue-600">
                {row.original.ma_giao_dich}
            </span>
        ),
    },
    {
        accessorKey: "mo_ta",
        header: "Mô tả",
        cell: ({ row }) => (
            <span className="text-gray-600">
                {row.original.mo_ta || "Thanh toán gói cước"}
            </span>
        ),
    },
    {
        accessorKey: "so_tien",
        header: "Số tiền",
        cell: ({ row }) => (
            <span className="font-medium text-gray-900">
                {row.original.so_tien?.toLocaleString("vi-VN")} đ
            </span>
        ),
    },
    {
        accessorKey: "phuong_thuc",
        header: "Phương thức",
        cell: ({ row }) => (
            <span className="text-gray-600 text-sm">
                {PHUONG_THUC[row.original.phuong_thuc] || row.original.phuong_thuc}
            </span>
        ),
    },
    {
        accessorKey: "ngay_thanh_toan",
        header: "Ngày thanh toán",
        cell: ({ row }) => {
            const date = row.original.ngay_thanh_toan;
            if (!date) return "---";
            return new Date(date).toLocaleDateString("vi-VN");
        },
    },
    {
        accessorKey: "trang_thai",
        header: "Trạng thái",
        cell: ({ row }) => {
            const config = TRANG_THAI_GD[row.original.trang_thai] || TRANG_THAI_GD.pending;
            return (
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", config.className)}>
                    {config.label}
                </span>
            );
        },
    },
];

// ============================================================================
// PRICING CARD
// ============================================================================

interface PricingCardProps {
    goiCuoc: GoiCuoc;
    isCurrentPlan?: boolean;
    onSelect: () => void;
}

function PricingCard({ goiCuoc, isCurrentPlan, onSelect }: PricingCardProps) {
    const isPopular = goiCuoc.ten_goi === "Professional";
    
    return (
        <div className={cn(
            "rounded-xl border-2 p-6 bg-white relative",
            isPopular ? "border-blue-500 shadow-lg" : "border-gray-200",
            isCurrentPlan && "ring-2 ring-green-500"
        )}>
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                        Phổ biến nhất
                    </span>
                </div>
            )}
            {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                        Gói hiện tại
                    </span>
                </div>
            )}
            
            <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">{goiCuoc.ten_goi}</h3>
                <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">
                        {goiCuoc.gia === 0 ? "Miễn phí" : `${(goiCuoc.gia / 1000).toFixed(0)}k`}
                    </span>
                    {goiCuoc.gia > 0 && (
                        <span className="text-gray-500">/tháng</span>
                    )}
                </div>
            </div>
            
            <ul className="space-y-3 mb-6">
                {goiCuoc.tinh_nang.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-green-500">✓</span>
                        {feature}
                    </li>
                ))}
            </ul>
            
            <Button
                className={cn(
                    "w-full",
                    isCurrentPlan 
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : isPopular 
                            ? "bg-blue-500 hover:bg-blue-600 text-white"
                            : ""
                )}
                variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
                onClick={onSelect}
                disabled={isCurrentPlan}
            >
                {isCurrentPlan ? "Đang sử dụng" : "Chọn gói này"}
            </Button>
        </div>
    );
}

// ============================================================================
// PAGE
// ============================================================================

export default function BillingPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("subscription");
    const [page, setPage] = useState(1);
    const limit = 10;

    // Fetch current subscription
    const subscriptionQuery = useQuery({
        queryKey: ["billing", "subscription"],
        queryFn: async () => {
            try {
                const response = await httpClient.get<{ data: Subscription }>("/billing/subscription");
                return response.data.data;
            } catch {
                // Return mock data if API fails
                return {
                    id: "1",
                    goi_cuoc: GOI_CUOC_DATA[0],
                    ngay_bat_dau: new Date().toISOString(),
                    ngay_ket_thuc: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    trang_thai: "active" as const,
                    so_user_da_dung: 2,
                    storage_da_dung: 512,
                };
            }
        },
    });

    // Fetch payment history
    const historyQuery = useQuery({
        queryKey: ["billing", "history", page, limit],
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<LichSuThanhToan>>("/billing/history", {
                params: { page, limit },
            });
            return response.data;
        },
        enabled: activeTab === "history",
    });

    const historyPagination: DataTablePagination | undefined = historyQuery.data?.meta ? {
        page: historyQuery.data.meta.page,
        limit: historyQuery.data.meta.limit,
        total: historyQuery.data.meta.total,
        totalPages: historyQuery.data.meta.totalPages,
    } : undefined;

    const currentSubscription = subscriptionQuery.data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gói cước & Thanh toán</h1>
                    <p className="text-gray-500 mt-1">Quản lý gói cước và lịch sử thanh toán</p>
                </div>
                <Button
                    onClick={() => toast({ title: "Liên hệ", description: "Vui lòng liên hệ support@serviceos.vn" })}
                    variant="outline"
                >
                    🎧 Hỗ trợ
                </Button>
            </div>

            {/* Current plan summary */}
            {currentSubscription && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gói cước hiện tại</CardTitle>
                        <CardDescription>Thông tin gói cước bạn đang sử dụng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-500">Tên gói</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">
                                    {currentSubscription.goi_cuoc.ten_goi}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Trạng thái</p>
                                <p className="mt-1">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                        Đang hoạt động
                                    </span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Người dùng</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">
                                    {currentSubscription.so_user_da_dung} / {currentSubscription.goi_cuoc.gioi_han_user || "∞"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Ngày hết hạn</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">
                                    {new Date(currentSubscription.ngay_ket_thuc).toLocaleDateString("vi-VN")}
                                </p>
                            </div>
                        </div>
                        
                        {/* Storage usage */}
                        <div className="mt-6">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-500">Dung lượng đã dùng</span>
                                <span className="font-medium">
                                    {currentSubscription.storage_da_dung}MB / {currentSubscription.goi_cuoc.gioi_han_storage}MB
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 rounded-full transition-all"
                                    style={{ 
                                        width: `${Math.min(100, (currentSubscription.storage_da_dung / (currentSubscription.goi_cuoc.gioi_han_storage || 1)) * 100)}%` 
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-gray-100">
                    <TabsTrigger value="subscription">Gói cước</TabsTrigger>
                    <TabsTrigger value="history">Lịch sử thanh toán</TabsTrigger>
                    <TabsTrigger value="invoices">Hóa đơn</TabsTrigger>
                </TabsList>

                <TabsContent value="subscription" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {GOI_CUOC_DATA.map((goiCuoc) => (
                            <PricingCard
                                key={goiCuoc.id}
                                goiCuoc={goiCuoc}
                                isCurrentPlan={currentSubscription?.goi_cuoc.id === goiCuoc.id}
                                onSelect={() => toast({ 
                                    title: `Nâng cấp lên ${goiCuoc.ten_goi}`, 
                                    description: "Chức năng đang phát triển" 
                                })}
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lịch sử thanh toán</CardTitle>
                            <CardDescription>Các giao dịch thanh toán gần đây</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable
                                columns={lichSuColumns}
                                data={historyQuery.data?.data || []}
                                pagination={historyPagination}
                                onPaginationChange={(newPage) => setPage(newPage)}
                                isLoading={historyQuery.isLoading}
                                emptyMessage="Chưa có giao dịch nào"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="invoices" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hóa đơn</CardTitle>
                            <CardDescription>Danh sách hóa đơn và xuất PDF</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">📄</span>
                                    </div>
                                    <p className="text-gray-500">Quản lý hóa đơn sẽ hiển thị tại đây</p>
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
