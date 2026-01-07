/**
 * API Hooks - TanStack Query Custom Hooks
 * 
 * Features:
 * - Type-safe API calls
 * - Automatic caching
 * - Loading/Error states
 * - Pagination support
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import httpClient, { PaginatedResponse, ApiResponse } from "@/lib/http";

// ============================================================================
// TYPES
// ============================================================================

export interface Job {
    id: string;
    ma_cong_viec: string;
    tieu_de: string;
    mo_ta?: string;
    trang_thai: "pending" | "in_progress" | "completed" | "cancelled";
    do_uu_tien: "low" | "medium" | "high" | "urgent";
    ngay_bat_dau?: string;
    ngay_ket_thuc?: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
    id_khach_hang?: string;
    khach_hang?: {
        id: string;
        ten_khach_hang: string;
        so_dien_thoai?: string;
    };
    id_nhan_vien?: string;
    nhan_vien?: {
        id: string;
        ho_ten: string;
    };
}

export interface CreateJobDto {
    tieu_de: string;
    mo_ta?: string;
    do_uu_tien?: "low" | "medium" | "high" | "urgent";
    ngay_bat_dau?: string;
    ngay_ket_thuc?: string;
    id_khach_hang?: string;
    id_nhan_vien?: string;
}

export interface UpdateJobDto extends Partial<CreateJobDto> {
    trang_thai?: "pending" | "in_progress" | "completed" | "cancelled";
}

export interface ListJobsParams {
    page?: number;
    limit?: number;
    search?: string;
    trang_thai?: string;
    do_uu_tien?: string;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const jobKeys = {
    all: ["jobs"] as const,
    lists: () => [...jobKeys.all, "list"] as const,
    list: (params: ListJobsParams) => [...jobKeys.lists(), params] as const,
    details: () => [...jobKeys.all, "detail"] as const,
    detail: (id: string) => [...jobKeys.details(), id] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Fetch jobs list with pagination
 */
export function useJobs(params: ListJobsParams = {}) {
    return useQuery({
        queryKey: jobKeys.list(params),
        queryFn: async () => {
            const response = await httpClient.get<PaginatedResponse<Job>>("/jobs", {
                params: {
                    page: params.page || 1,
                    limit: params.limit || 10,
                    search: params.search,
                    trang_thai: params.trang_thai,
                    do_uu_tien: params.do_uu_tien,
                },
            });
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Fetch single job by ID
 */
export function useJob(id: string) {
    return useQuery({
        queryKey: jobKeys.detail(id),
        queryFn: async () => {
            const response = await httpClient.get<ApiResponse<Job>>(`/jobs/${id}`);
            return response.data.data;
        },
        enabled: !!id,
    });
}

/**
 * Create new job
 */
export function useCreateJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateJobDto) => {
            const response = await httpClient.post<ApiResponse<Job>>("/jobs", data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
        },
    });
}

/**
 * Update job
 */
export function useUpdateJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateJobDto }) => {
            const response = await httpClient.patch<ApiResponse<Job>>(`/jobs/${id}`, data);
            return response.data.data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
            queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) });
        },
    });
}

/**
 * Delete job
 */
export function useDeleteJob() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await httpClient.delete(`/jobs/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: jobKeys.lists() });
        },
    });
}
