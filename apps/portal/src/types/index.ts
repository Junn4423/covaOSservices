/**
 * TypeScript Type Definitions
 * Shared types for the frontend application
 */

// User types
export interface User {
  id: string;
  email: string;
  ho_ten: string;
  so_dien_thoai?: string;
  anh_dai_dien?: string;
  vai_tro: UserRole;
  phong_ban?: string;
  trang_thai: number;
  id_doanh_nghiep: string;
  doanh_nghiep?: Tenant;
}

export type UserRole = "admin" | "manager" | "technician" | "accountant" | "viewer";

// Tenant types
export interface Tenant {
  id: string;
  ten_doanh_nghiep: string;
  ma_doanh_nghiep: string;
  email?: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  logo_url?: string;
  goi_cuoc: PlanType;
  ngay_het_han_goi?: string;
  trang_thai: number;
}

export type PlanType = "trial" | "basic" | "pro" | "enterprise";

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
  tenant_code?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Notification types
export interface Notification {
  id: string;
  tieu_de: string;
  noi_dung?: string;
  loai_thong_bao?: string;
  id_doi_tuong_lien_quan?: string;
  loai_doi_tuong?: string;
  da_xem: number;
  ngay_xem?: string;
  ngay_tao: string;
}

// File/Storage types
export interface UploadedFile {
  fileId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  url: string;
  bucket: string;
  uploadedAt: string;
}

export interface FileListResponse {
  data: UploadedFile[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
