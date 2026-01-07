/**
 * Socket Store - Re-export from new stores location
 * @deprecated Use @/stores/socket.store instead
 */

export {
  useSocketStore,
  getSocketStatus,
  isSocketConnected
} from "@/stores/socket.store";
