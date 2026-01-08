/**
 * Auth Store - Re-export from new stores location
 * @deprecated Use @/stores/auth.store instead
 */

export {
  useAuthStore,
  initializeAuth,
  isAuthInitialized,
  resetAuthInit
} from "@/stores/auth.store";
export type { User, UserRole, LoginCredentials, AuthState } from "@/stores/auth.store";
