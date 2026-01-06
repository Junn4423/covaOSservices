/**
 * ============================================================
 * Global Exception Filter - Error Handling
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
    success: boolean;
    error: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
    path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'Đã xảy ra lỗi hệ thống';
        let details: any = undefined;

        // Handle HTTP Exceptions
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const res = exceptionResponse as any;
                message = res.message || message;
                code = res.error || this.getErrorCode(status);
                details = res.details;
            }
        }

        // Handle Prisma Errors
        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            const prismaError = this.handlePrismaError(exception);
            status = prismaError.status;
            code = prismaError.code;
            message = prismaError.message;
        }

        if (exception instanceof Prisma.PrismaClientValidationError) {
            status = HttpStatus.BAD_REQUEST;
            code = 'VALIDATION_ERROR';
            message = 'Dữ liệu không hợp lệ';
        }

        // Log error
        this.logger.error(
            `[${code}] ${message}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        const errorResponse: ErrorResponse = {
            success: false,
            error: {
                code,
                message,
                ...(details && { details }),
            },
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        response.status(status).json(errorResponse);
    }

    private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
        status: number;
        code: string;
        message: string;
    } {
        switch (error.code) {
            case 'P2002':
                return {
                    status: HttpStatus.CONFLICT,
                    code: 'DUPLICATE_ENTRY',
                    message: 'Dữ liệu đã tồn tại trong hệ thống',
                };
            case 'P2025':
                return {
                    status: HttpStatus.NOT_FOUND,
                    code: 'NOT_FOUND',
                    message: 'Không tìm thấy dữ liệu',
                };
            case 'P2003':
                return {
                    status: HttpStatus.BAD_REQUEST,
                    code: 'FOREIGN_KEY_ERROR',
                    message: 'Dữ liệu liên kết không tồn tại',
                };
            default:
                return {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    code: 'DATABASE_ERROR',
                    message: 'Lỗi cơ sở dữ liệu',
                };
        }
    }

    private getErrorCode(status: number): string {
        const codes: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_ERROR',
        };
        return codes[status] || 'UNKNOWN_ERROR';
    }
}
