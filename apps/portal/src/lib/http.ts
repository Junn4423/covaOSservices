/**
 * HTTP Client Configuration (Production-Ready)
 * Advanced Axios with Token Refresh, Request Queue, and TanStack Query Integration
 * 
 * Features:
 * - Silent Token Refresh on 401
 * - Request Queue during refresh
 * - Automatic retry after refresh
 * - Memory-based token storage (more secure)
 * - Upload progress tracking
 */

import axios, {
    AxiosError,
    AxiosInstance,
    AxiosProgressEvent,
    InternalAxiosRequestConfig,
} from "axios";
import { QueryClient } from "@tanstack/react-query";

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
const REQUEST_TIMEOUT = 30000;
const MAX_RETRY_ATTEMPTS = 3;

// ============================================================================
// TOKEN MANAGER (Memory-based for security)
// ============================================================================

interface TokenManager {
    accessToken: string | null;
    refreshToken: string | null;
    isRefreshing: boolean;
    refreshSubscribers: Array<(token: string) => void>;
}

const tokenManager: TokenManager = {
    accessToken: null,
    refreshToken: null,
    isRefreshing: false,
    refreshSubscribers: [],
};

// Helper to check if a string looks like a valid JWT (3 parts separated by dots)
const isValidJwtFormat = (token: string): boolean => {
    if (!token || typeof token !== "string") return false;
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    // Basic check that each part is non-empty and looks like base64
    return parts.every((part) => part.length > 0 && /^[A-Za-z0-9_-]+$/.test(part));
};

export const TokenService = {
    getAccessToken: (): string | null => {
        // First check memory
        if (tokenManager.accessToken && isValidJwtFormat(tokenManager.accessToken)) {
            return tokenManager.accessToken;
        }
        // Fallback to localStorage (for hydration)
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("accessToken");
            if (stored && isValidJwtFormat(stored)) {
                tokenManager.accessToken = stored;
                return stored;
            }
            // Clear invalid token from localStorage
            if (stored && !isValidJwtFormat(stored)) {
                console.warn("[TokenService] Xoa token loi dinh dang");
                localStorage.removeItem("accessToken");
            }
        }
        return null;
    },

    setAccessToken: (token: string | null): void => {
        tokenManager.accessToken = token;
        if (typeof window !== "undefined") {
            if (token) {
                localStorage.setItem("accessToken", token);
            } else {
                localStorage.removeItem("accessToken");
            }
        }
    },

    getRefreshToken: (): string | null => {
        if (tokenManager.refreshToken) {
            return tokenManager.refreshToken;
        }
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("refreshToken");
            if (stored) {
                tokenManager.refreshToken = stored;
                return stored;
            }
        }
        return null;
    },

    setRefreshToken: (token: string | null): void => {
        tokenManager.refreshToken = token;
        if (typeof window !== "undefined") {
            if (token) {
                localStorage.setItem("refreshToken", token);
            } else {
                localStorage.removeItem("refreshToken");
            }
        }
    },

    clearTokens: (): void => {
        tokenManager.accessToken = null;
        tokenManager.refreshToken = null;
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("auth-storage");
        }
    },

    // Subscribe to token refresh
    subscribeToRefresh: (callback: (token: string) => void): void => {
        tokenManager.refreshSubscribers.push(callback);
    },

    // Notify all subscribers with new token
    notifySubscribers: (token: string): void => {
        tokenManager.refreshSubscribers.forEach((callback) => callback(token));
        tokenManager.refreshSubscribers = [];
    },
};

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

export const httpClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true, // For HttpOnly cookies if backend supports
});

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

httpClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = TokenService.getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================================
// RESPONSE INTERCEPTOR (With Silent Token Refresh)
// ============================================================================

httpClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
            _retryCount?: number;
        };

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // If already refreshing, queue this request
            if (tokenManager.isRefreshing) {
                return new Promise((resolve) => {
                    TokenService.subscribeToRefresh((newToken: string) => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        }
                        resolve(httpClient(originalRequest));
                    });
                });
            }

            // Start refresh process
            tokenManager.isRefreshing = true;

            try {
                const refreshToken = TokenService.getRefreshToken();

                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                // Call refresh endpoint
                const response = await axios.post(
                    `${API_URL}/auth/refresh`,
                    { refresh_token: refreshToken },
                    { withCredentials: true }
                );

                const { accessToken, refreshToken: newRefreshToken, access_token, refresh_token } =
                    response.data as Record<string, any>;

                const access = accessToken ?? access_token;
                const nextRefresh = newRefreshToken ?? refresh_token;

                TokenService.setAccessToken(access);
                if (nextRefresh) {
                    TokenService.setRefreshToken(nextRefresh);
                }

                // Notify queued requests
                TokenService.notifySubscribers(accessToken);

                // Retry original request
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }
                return httpClient(originalRequest);

            } catch (refreshError) {
                // Refresh failed - force logout
                TokenService.clearTokens();
                tokenManager.refreshSubscribers = [];

                // Import and call logout from auth store
                if (typeof window !== "undefined") {
                    try {
                        const { useAuthStore } = await import("@/stores/auth.store");
                        useAuthStore.getState().forceLogout();
                    } catch {
                        // Fallback: redirect to login
                        if (!window.location.pathname.includes("/login")) {
                            window.location.href = "/login";
                        }
                    }
                }

                return Promise.reject(refreshError);
            } finally {
                tokenManager.isRefreshing = false;
            }
        }

        // Handle other errors
        const errorMessage =
            (error.response?.data as Record<string, unknown>)?.message ||
            error.message ||
            "Co loi xay ra. Vui long thu lai.";

        return Promise.reject({
            ...error,
            message: errorMessage,
            statusCode: error.response?.status,
        });
    }
);

// ============================================================================
// TANSTACK QUERY CLIENT (Aggressive Caching)
// ============================================================================

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
            retry: (failureCount, error) => {
                // Don't retry on 401 or 403
                const axiosError = error as AxiosError;
                if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                    return false;
                }
                return failureCount < MAX_RETRY_ATTEMPTS;
            },
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
        mutations: {
            retry: false,
        },
    },
});

// ============================================================================
// API HELPER FUNCTIONS
// ============================================================================

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
    statusCode?: number;
    error?: string;
}

// Upload helper with progress
export const uploadFile = async (
    endpoint: string,
    file: File,
    options?: {
        folder?: string;
        onProgress?: (progress: number) => void;
    }
): Promise<ApiResponse<{ url: string; fileId: string }>> => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.folder) {
        formData.append("folder", options.folder);
    }

    const response = await httpClient.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total && options?.onProgress) {
                const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                options.onProgress(progress);
            }
        },
    });

    return response.data;
};

export default httpClient;
