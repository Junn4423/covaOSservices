/**
 * GlobalLoader Component
 * Shows during initial auth check to prevent content flash
 */

"use client";

import { cn } from "@/lib/utils";

interface GlobalLoaderProps {
    message?: string;
    className?: string;
}

export function GlobalLoader({
    message = "Dang tai...",
    className
}: GlobalLoaderProps) {
    return (
        <div
            className={cn(
                "fixed inset-0 z-[9999] flex flex-col items-center justify-center",
                "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
                className
            )}
        >
            {/* Logo */}
            <div className="mb-8 relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
                    <span className="text-3xl font-bold text-white">S</span>
                </div>
                {/* Pulse Effect */}
                <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-ping opacity-20" />
            </div>

            {/* Brand */}
            <h1 className="text-2xl font-bold text-white mb-2">ServiceOS</h1>
            <p className="text-slate-400 text-sm mb-8">Nen tang quan ly dich vu</p>

            {/* Spinner */}
            <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
            </div>

            {/* Message */}
            <p className="mt-6 text-slate-500 text-sm animate-pulse">{message}</p>
        </div>
    );
}

export default GlobalLoader;
