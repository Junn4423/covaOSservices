/**
 * API Client Configuration
 * @deprecated Use @/lib/http instead
 * 
 * This file re-exports from the new http client for backwards compatibility
 */

import httpClient, { TokenService, queryClient, uploadFile, ApiResponse, PaginatedResponse, ApiError } from "./http";

// Re-export everything from http.ts
export { httpClient, TokenService, queryClient, uploadFile };
export type { ApiResponse, PaginatedResponse, ApiError };

// Legacy export name
export const apiClient = httpClient;

// Legacy API object for backwards compatibility
export const api = {
  auth: {
    login: async (credentials: { email: string; password: string; tenant_code?: string }) => {
      return httpClient.post("/auth/login", credentials);
    },
    logout: async () => {
      return httpClient.post("/auth/logout");
    },
    me: async () => {
      return httpClient.get("/auth/me");
    },
    refresh: async (refreshToken: string) => {
      return httpClient.post("/auth/refresh", { refreshToken });
    },
  },
  storage: {
    getStatus: async () => {
      return httpClient.get("/storage/status");
    },
    uploadImage: async (file: File, folder: string, onProgress?: (progress: number) => void) => {
      return uploadFile("/storage/upload/image", file, { folder, onProgress });
    },
    uploadFile: async (file: File, folder: string, onProgress?: (progress: number) => void) => {
      return uploadFile("/storage/upload/file", file, { folder, onProgress });
    },
    delete: async (fileUrl: string) => {
      return httpClient.delete("/storage/delete", { data: { fileUrl } });
    },
    getPresignedUrl: async (fileName: string, folder: string) => {
      return httpClient.post("/storage/presigned-url", { fileName, folder });
    },
  },
  realtime: {
    testNotification: async (title: string, message: string) => {
      return httpClient.post("/realtime/test-notification", { title, message });
    },
  },
  notifications: {
    list: async (params?: { page?: number; limit?: number }) => {
      return httpClient.get("/notifications", { params });
    },
    markAsRead: async (id: string) => {
      return httpClient.patch(`/notifications/${id}/read`);
    },
    markAllAsRead: async () => {
      return httpClient.patch("/notifications/read-all");
    },
    getUnreadCount: async () => {
      return httpClient.get("/notifications/unread-count");
    },
  },
};

export default api;
