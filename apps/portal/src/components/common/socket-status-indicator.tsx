/**
 * SocketStatusIndicator Component
 * Hien thi trang thai ket noi Socket tren Header
 * Su dung mau sac tu Design System
 */

"use client";

import { useSocketStore } from "@/stores";
import { cn } from "@/lib/utils";

interface SocketStatusIndicatorProps {
    showLabel?: boolean;
    className?: string;
}

export function SocketStatusIndicator({
    showLabel = true,
    className,
}: SocketStatusIndicatorProps) {
    const status = useSocketStore((state) => state.status);

    const statusConfig = {
        connected: {
            dotClass: "socket-connected",
            label: "Da ket noi",
            ringClass: "ring-[var(--primary-green)]/30",
        },
        connecting: {
            dotClass: "bg-[var(--warning)]",
            label: "Dang ket noi...",
            ringClass: "ring-[var(--warning)]/30",
        },
        disconnected: {
            dotClass: "socket-disconnected",
            label: "Mat ket noi",
            ringClass: "ring-[var(--gray-500)]/30",
        },
        error: {
            dotClass: "socket-error",
            label: "Loi ket noi",
            ringClass: "ring-[var(--error)]/30",
        },
    };

    const config = statusConfig[status];

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Status Dot */}
            <div className="relative">
                <div
                    className={cn(
                        "w-2.5 h-2.5 rounded-full ring-4",
                        config.dotClass,
                        config.ringClass
                    )}
                />
                {/* Pulse animation khi dang ket noi */}
                {(status === "connected" || status === "connecting") && (
                    <div
                        className={cn(
                            "absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-75",
                            config.dotClass
                        )}
                    />
                )}
            </div>

            {/* Label */}
            {showLabel && (
                <span className="text-xs text-[var(--gray-600)] hidden sm:inline">
                    {config.label}
                </span>
            )}
        </div>
    );
}

export default SocketStatusIndicator;
