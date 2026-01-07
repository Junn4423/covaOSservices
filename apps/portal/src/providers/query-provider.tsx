/**
 * TanStack Query Provider
 * Client-side wrapper for Query context
 */

"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/http";

interface QueryProviderProps {
    children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

export default QueryProvider;
