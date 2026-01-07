/**
 * Auth Store - Zustand State Management
 * Handles authentication state and actions
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api";
import { initializeSocket, disconnectSocket } from "@/lib/socket";
import type { User, LoginRequest } from "@/types";

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.auth.login(credentials);
          const { accessToken, user } = response.data;

          // Update state
          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store token in localStorage for API interceptor
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", accessToken);
          }

          // Initialize socket connection
          initializeSocket(accessToken);

          return true;
        } catch (error: any) {
          const errorMessage = error.message || "Login failed";
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      // Logout action
      logout: () => {
        // Disconnect socket
        disconnectSocket();

        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
        }

        // Reset state
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // Set user
      setUser: (user) => set({ user }),

      // Set token
      setToken: (token) => {
        set({ accessToken: token, isAuthenticated: !!token });
        if (typeof window !== "undefined") {
          if (token) {
            localStorage.setItem("accessToken", token);
          } else {
            localStorage.removeItem("accessToken");
          }
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Check authentication status
      checkAuth: async () => {
        const { accessToken } = get();
        
        if (!accessToken) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        try {
          const response = await api.auth.me();
          set({ user: response.data, isAuthenticated: true });
          
          // Initialize socket if not already connected
          initializeSocket(accessToken);
          
          return true;
        } catch {
          set({ isAuthenticated: false, user: null, accessToken: null });
          if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
          }
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
