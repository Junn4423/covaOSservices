/**
 * Store Index - Re-export from new stores location
 * @deprecated Use @/stores instead
 */

export {
    useAuthStore,
    initializeAuth,
    isAuthInitialized
} from "@/stores/auth.store";
export type { User, UserRole, LoginCredentials, AuthState } from "@/stores/auth.store";

export {
    useSocketStore,
    getSocketStatus,
    isSocketConnected
} from "@/stores/socket.store";
