/**
 * GlobalLoader Component
 * Hien thi trong qua trinh xac thuc de tranh content flash
 * Su dung mau sac tu Design System
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
                "bg-[var(--primary-navy)]",
                className
            )}
        >
            {/* Logo */}
            <div className="mb-8 relative">
                <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl"
                    style={{ 
                        backgroundColor: "var(--primary-dark)",
                        boxShadow: "0 25px 50px -12px rgba(18, 78, 102, 0.4)"
                    }}
                >
                    <span className="text-3xl font-bold text-[var(--white)]">S</span>
                </div>
                {/* Pulse Effect */}
                <div 
                    className="absolute inset-0 w-20 h-20 rounded-2xl animate-ping opacity-20"
                    style={{ backgroundColor: "var(--primary-dark)" }}
                />
            </div>

            {/* Brand */}
            <h1 className="text-2xl font-bold text-[var(--white)] mb-2">ServiceOS</h1>
            <p className="text-[var(--gray-400)] text-sm mb-8">Nền tảng quản lý dịch vụ doanh nghiệp</p>

            {/* Spinner */}
            <div className="relative">
                <div 
                    className="w-12 h-12 border-4 rounded-full animate-spin"
                    style={{ 
                        borderColor: "var(--gray-700)",
                        borderTopColor: "var(--primary-blue)"
                    }}
                />
            </div>

            {/* Message */}
            <p className="mt-6 text-[var(--gray-500)] text-sm animate-pulse">{message}</p>
        </div>
    );
}

export default GlobalLoader;
