/**
 * SocketStatusIndicator Component
 * Shows connection status in header (Green=Connected, Red=Disconnected)
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
            color: "bg-emerald-500",
            pulse: "bg-emerald-400",
            label: "Da ket noi",
            ring: "ring-emerald-500/30",
        },
        connecting: {
            color: "bg-amber-500",
            pulse: "bg-amber-400",
            label: "Dang ket noi...",
            ring: "ring-amber-500/30",
        },
        disconnected: {
            color: "bg-red-500",
            pulse: "bg-red-400",
            label: "Mat ket noi",
            ring: "ring-red-500/30",
        },
        error: {
            color: "bg-red-500",
            pulse: "bg-red-400",
            label: "Loi ket noi",
            ring: "ring-red-500/30",
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
                        config.color,
                        config.ring
                    )}
                />
                {/* Pulse animation for connected/connecting */}
                {(status === "connected" || status === "connecting") && (
                    <div
                        className={cn(
                            "absolute inset-0 w-2.5 h-2.5 rounded-full animate-ping opacity-75",
                            config.pulse
                        )}
                    />
                )}
            </div>

            {/* Label */}
            {showLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                    {config.label}
                </span>
            )}
        </div>
    );
}

export default SocketStatusIndicator;
