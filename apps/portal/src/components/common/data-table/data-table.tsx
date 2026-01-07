/**
 * Smart Data Table - Generic Reusable Table Component
 * 
 * Features:
 * - Server-side pagination
 * - Search with debounce
 * - Column visibility toggle
 * - Row actions (Edit/Delete)
 * - Sorting
 * - Loading skeleton
 * - Empty state
 * - Vietnamese labels
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type VisibilityState,
    type PaginationState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ============================================================================
// TYPES
// ============================================================================

export interface DataTablePagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface DataTableProps<TData, TValue> {
    // Data & Columns
    columns: ColumnDef<TData, TValue>[];
    data: TData[];

    // Pagination
    pagination?: DataTablePagination;
    onPaginationChange?: (page: number, limit: number) => void;

    // Search
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (value: string) => void;

    // Loading & States
    isLoading?: boolean;
    emptyMessage?: string;

    // Actions
    onRowClick?: (row: TData) => void;
    onEdit?: (row: TData) => void;
    onDelete?: (row: TData) => void;

    // Customization
    className?: string;
    showColumnToggle?: boolean;
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100 dark:border-slate-800">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <td key={colIndex} className="px-4 py-3">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

// ============================================================================
// DATA TABLE COMPONENT
// ============================================================================

export function DataTable<TData, TValue>({
    columns,
    data,
    pagination,
    onPaginationChange,
    searchPlaceholder = "Tim kiem...",
    searchValue = "",
    onSearchChange,
    isLoading = false,
    emptyMessage = "Khong co du lieu",
    onRowClick,
    onEdit,
    onDelete,
    className,
    showColumnToggle = true,
}: DataTableProps<TData, TValue>) {
    // Local state
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = useState(searchValue);
    const [showColumnMenu, setShowColumnMenu] = useState(false);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange?.(globalFilter);
        }, 300);

        return () => clearTimeout(timer);
    }, [globalFilter, onSearchChange]);

    // Action column
    const actionColumn = useMemo<ColumnDef<TData, TValue> | null>(() => {
        if (!onEdit && !onDelete) return null;

        return {
            id: "actions",
            header: "Thao tac",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(row.original);
                            }}
                            className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        >
                            Sua
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(row.original);
                            }}
                            className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            Xoa
                        </Button>
                    )}
                </div>
            ),
        } as ColumnDef<TData, TValue>;
    }, [onEdit, onDelete]);

    // Combine columns with action column
    const allColumns = useMemo(() => {
        if (actionColumn) {
            return [...columns, actionColumn];
        }
        return columns;
    }, [columns, actionColumn]);

    // Table instance
    const table = useReactTable({
        data,
        columns: allColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnVisibility,
            globalFilter,
        },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        manualPagination: !!pagination,
    });

    // Page info
    const pageInfo = pagination
        ? {
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total,
            hasNext: pagination.page < pagination.totalPages,
            hasPrev: pagination.page > 1,
        }
        : null;

    return (
        <div className={cn("space-y-4", className)}>
            {/* ========================================
          Toolbar
          ======================================== */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Search */}
                <div className="relative max-w-sm">
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        [Q]
                    </span>
                </div>

                {/* Column Toggle */}
                {showColumnToggle && (
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            className="border-slate-200 dark:border-slate-700"
                        >
                            Cot hien thi
                        </Button>

                        {showColumnMenu && (
                            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-10">
                                <div className="p-2">
                                    {table
                                        .getAllColumns()
                                        .filter((column) => column.getCanHide())
                                        .map((column) => (
                                            <label
                                                key={column.id}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={column.getIsVisible()}
                                                    onChange={() => column.toggleVisibility()}
                                                    className="rounded text-indigo-600"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                                                    {column.id}
                                                </span>
                                            </label>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========================================
          Table
          ======================================== */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        {/* Header */}
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={cn(
                                                "px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider",
                                                header.column.getCanSort() && "cursor-pointer hover:text-slate-900 dark:hover:text-white"
                                            )}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-2">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                {/* Sort indicator */}
                                                {{
                                                    asc: " [^]",
                                                    desc: " [v]",
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        {/* Body */}
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {isLoading ? (
                                <TableSkeleton columns={allColumns.length} />
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={allColumns.length}
                                        className="px-4 py-12 text-center text-slate-500"
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        onClick={() => onRowClick?.(row.original)}
                                        className={cn(
                                            "transition-colors",
                                            onRowClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        )}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========================================
          Pagination
          ======================================== */}
            {pageInfo && (
                <div className="flex items-center justify-between">
                    {/* Info */}
                    <p className="text-sm text-slate-500">
                        Trang {pageInfo.currentPage} / {pageInfo.totalPages} (Tong: {pageInfo.total})
                    </p>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPaginationChange?.(pageInfo.currentPage - 1, pagination!.limit)}
                            disabled={!pageInfo.hasPrev || isLoading}
                            className="border-slate-200 dark:border-slate-700"
                        >
                            Truoc
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPaginationChange?.(pageInfo.currentPage + 1, pagination!.limit)}
                            disabled={!pageInfo.hasNext || isLoading}
                            className="border-slate-200 dark:border-slate-700"
                        >
                            Sau
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
