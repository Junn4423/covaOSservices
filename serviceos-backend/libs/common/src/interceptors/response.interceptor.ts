/**
 * ============================================================
 * Response Interceptor - Standardized API Response Format
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
    message: string;
    timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        return next.handle().pipe(
            map((response) => {
                // If response already has our format, return as-is
                if (response?.success !== undefined && response?.data !== undefined) {
                    return {
                        ...response,
                        timestamp: new Date().toISOString(),
                    };
                }

                // Handle paginated responses
                if (response?.data && response?.meta) {
                    return {
                        success: true,
                        data: response.data,
                        meta: response.meta,
                        message: response.message || 'Thành công',
                        timestamp: new Date().toISOString(),
                    };
                }

                // Standard response wrapper
                return {
                    success: true,
                    data: response,
                    message: 'Thành công',
                    timestamp: new Date().toISOString(),
                };
            }),
        );
    }
}
