/**
 * API Client Configuration
 * Axios instance with interceptors for authentication
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// Create Axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
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
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        
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
      "An error occurred";

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
  },

  // Storage endpoints
  storage: {
    upload: (file: File, folder?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) formData.append("folder", folder);
      return apiClient.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    uploadImage: (file: File, folder?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (folder) formData.append("folder", folder);
      return apiClient.post("/storage/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    list: (params?: { folder?: string; page?: number; limit?: number }) =>
      apiClient.get("/storage", { params }),
    delete: (fileId: string) => apiClient.delete(`/storage/${fileId}`),
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
};

export default apiClient;
