/**
 * Auth Store - Production-Ready Authentication State Management
 * 
 * Features:
 * - initializeAuth() runs BEFORE React renders to prevent flash
 * - Strict token management via TokenService
 * - Socket connection coordinated with auth state
 * - No race conditions between auth and socket
 * - Force logout capability for token errors
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import httpClient, { TokenService, queryClient } from "@/lib/http";
import { socketManager } from "@/lib/socket-manager";

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = "admin" | "manager" | "technician" | "accountant" | "viewer";

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
    doanh_nghiep?: {
        id: string;
        ten_doanh_nghiep: string;
        ma_doanh_nghiep: string;
        logo_url?: string;
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
    tenant_code?: string;
}

export interface AuthState {
    // State
    user: User | null;
    isAuthenticated: boolean;
    isInitialized: boolean; // Critical: prevents flash
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginCredentials) => Promise<boolean>;
    logout: () => void;
    forceLogout: () => void; // Called by interceptors
    setUser: (user: User | null) => void;
    clearError: () => void;
    initializeAuth: () => Promise<boolean>;
}

// ============================================================================
// INITIALIZATION STATE (Module-level for singleton behavior)
// ============================================================================

let authInitPromise: Promise<boolean> | null = null;
let isInitializing = false;

// ============================================================================
// AUTH STORE
// ============================================================================

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // ========================================
            // Initial State
            // ========================================
            user: null,
            isAuthenticated: false,
            isInitialized: false,
            isLoading: false,
            error: null,

            // ========================================
            // Initialize Auth (MUST run before render)
            // ========================================
            initializeAuth: async () => {
                const token = TokenService.getAccessToken();

                if (!token) {
                    set({ isInitialized: true, isAuthenticated: false, user: null });
                    return false;
                }

                try {
                    // Backend exposes /auth/profile
                    const response = await httpClient.get("/auth/profile");
                    const user = response.data;

                    set({
                        user,
                        isAuthenticated: true,
                        isInitialized: true,
                        isLoading: false,
                    });

                    socketManager.connect(token);
                    return true;
                } catch (error) {
                    TokenService.clearTokens();
                    set({
                        user: null,
                        isAuthenticated: false,
                        isInitialized: true,
                        isLoading: false,
                    });
                    return false;
                }
            },

            // ========================================
            // Login
            // ========================================
            login: async (credentials: LoginCredentials) => {
                set({ isLoading: true, error: null });

                try {
                    const response = await httpClient.post("/auth/login", credentials);
                    const {
                        accessToken,
                        refreshToken,
                        access_token,
                        refresh_token,
                        user,
                    } = response.data as Record<string, any>;

                    const access = accessToken ?? access_token;
                    const refresh = refreshToken ?? refresh_token;

                    if (!access) {
                        throw new Error("Phản hồi đăng nhập không chứa access token");
                    }

                    TokenService.setAccessToken(access);
                    if (refresh) {
                        TokenService.setRefreshToken(refresh);
                    }

                    // Update state
                    set({
                        user,
                        isAuthenticated: true,
                        isInitialized: true,
                        isLoading: false,
                        error: null,
                    });

                    // Connect socket with new token
                    socketManager.connect(access);

                    return true;
                } catch (error: unknown) {
                    const errorMessage =
                        (error as { message?: string })?.message ||
                        "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";

                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: errorMessage,
                    });

                    return false;
                }
            },

            // ========================================
            // Logout (User-initiated)
            // ========================================
            logout: () => {
                const performLogout = async () => {
                    try {
                        // Notify backend
                        await httpClient.post("/auth/logout");
                    } catch {
                        // Ignore logout errors
                    }

                    // Disconnect socket FIRST
                    socketManager.disconnect();

                    // Clear tokens
                    TokenService.clearTokens();

                    // Clear query cache
                    queryClient.clear();

                    // Reset auth init promise (will be set in resetAuthInit)
                    authInitPromise = null;
                    isInitializing = false;

                    // Reset state
                    set({
                        user: null,
                        isAuthenticated: false,
                        isInitialized: false,
                        isLoading: false,
                        error: null,
                    });

                    // Redirect to login
                    if (typeof window !== "undefined") {
                        window.location.href = "/login";
                    }
                };

                performLogout();
            },

            // ========================================
            // Force Logout (Called by interceptors)
            // ========================================
            forceLogout: () => {
                // Disconnect socket
                socketManager.disconnect();

                // Clear tokens
                TokenService.clearTokens();

                // Clear query cache
                queryClient.clear();

                // Reset auth init promise
                authInitPromise = null;
                isInitializing = false;

                // Reset state
                set({
                    user: null,
                    isAuthenticated: false,
                    isInitialized: false,
                    isLoading: false,
                    error: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
                });

                // Redirect to login
                if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
                    window.location.href = "/login";
                }
            },

            // ========================================
            // Set User
            // ========================================
            setUser: (user) => set({ user }),

            // ========================================
            // Clear Error
            // ========================================
            clearError: () => set({ error: null }),
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist non-sensitive data
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            // Rehydrate sets hasHydrated but keeps isInitialized false
            // This ensures we verify token before trusting persisted state
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Keep isInitialized false - will be set after API validation
                    state.isInitialized = false;
                    state.isLoading = false;
                }
            },
        }
    )
);

// ============================================================================
// INITIALIZATION HELPER
// ============================================================================

/**
 * Initialize auth state before React renders
 * Call this in _app.tsx or root layout
 * Prevents content flash by ensuring auth state is known
 */
export const initializeAuth = (): Promise<boolean> => {
    // If already initialized, return immediately
    if (useAuthStore.getState().isInitialized) {
        return Promise.resolve(useAuthStore.getState().isAuthenticated);
    }

    // If already in progress, return existing promise
    if (authInitPromise && isInitializing) {
        return authInitPromise;
    }

    // Start new initialization
    isInitializing = true;
    authInitPromise = useAuthStore.getState().initializeAuth().finally(() => {
        isInitializing = false;
    });
    
    return authInitPromise;
};

/**
 * Reset auth initialization (useful for logout)
 */
export const resetAuthInit = (): void => {
    authInitPromise = null;
    isInitializing = false;
};

/**
 * Check if auth has been initialized
 */
export const isAuthInitialized = (): boolean => {
    return useAuthStore.getState().isInitialized;
};

export default useAuthStore;
