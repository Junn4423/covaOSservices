/**
 * API Client Configuration
 * Axios instance with interceptors for authentication
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosProgressEvent } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// Create Axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - Attach Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (client-side only)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Clear token and redirect to login
      if (typeof window !== "undefined") {
        // Import and use auth store for proper logout
        try {
          const { useAuthStore } = await import("@/store/auth.store");
          useAuthStore.getState().logout();
        } catch {
          // Fallback: manual cleanup if store import fails
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }

        // Redirect to login page if not already there
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }

    // Extract error message
    const errorMessage =
      (error.response?.data as any)?.message ||
      error.message ||
      "Có lỗi xảy ra";

    return Promise.reject({
      ...error,
      message: errorMessage,
    });
  }
);

// API Methods
export const api = {
  // Auth endpoints
  auth: {
    login: (data: { email: string; password: string; tenant_code?: string }) =>
      apiClient.post("/auth/login", data),
    register: (data: any) => apiClient.post("/auth/register", data),
    me: () => apiClient.get("/auth/me"),
    logout: () => apiClient.post("/auth/logout"),
    refreshToken: () => apiClient.post("/auth/refresh"),
  },

  // Storage endpoints
  storage: {
    upload: (file: File, folder?: string, onUploadProgress?: (progress: number) => void) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) formData.append("folder", folder);
      return apiClient.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total && onUploadProgress) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onUploadProgress(progress);
          }
        },
      });
    },
    uploadImage: (file: File, folder?: string, onUploadProgress?: (progress: number) => void) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) formData.append("folder", folder);
      return apiClient.post("/storage/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total && onUploadProgress) {
            const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
            onUploadProgress(progress);
          }
        },
      });
    },
    uploadMultiple: (files: File[], folder?: string) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      if (folder) formData.append("folder", folder);
      return apiClient.post("/storage/upload/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    list: (params?: { folder?: string; page?: number; limit?: number }) =>
      apiClient.get("/storage", { params }),
    getFileInfo: (fileId: string) => apiClient.get(`/storage/${fileId}`),
    delete: (fileId: string) => apiClient.delete(`/storage/${fileId}`),
    getSignedUrl: (key: string, expiresIn?: number) =>
      apiClient.post("/storage/signed-url", { key, expiresIn }),
    getStatus: () => apiClient.get("/storage/status/health"),
  },

  // Notification endpoints
  notifications: {
    list: (params?: { page?: number; limit?: number; da_xem?: boolean }) =>
      apiClient.get("/thong-bao", { params }),
    markAsRead: (id: string) => apiClient.patch(`/thong-bao/${id}/read`),
    markAllRead: () => apiClient.patch("/thong-bao/read-all"),
    getUnreadCount: () => apiClient.get("/thong-bao/unread-count"),
  },

  // User endpoints
  users: {
    me: () => apiClient.get("/users/me"),
    update: (data: any) => apiClient.patch("/users/me", data),
    updateAvatar: (url: string) => apiClient.patch("/users/me", { anh_dai_dien: url }),
  },

  // Realtime test endpoint
  realtime: {
    sendTestNotification: (data: { title: string; message: string; userId?: string }) =>
      apiClient.post("/realtime/test-notification", data),
  },
};

export default apiClient;

