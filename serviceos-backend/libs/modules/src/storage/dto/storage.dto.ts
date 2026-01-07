/**
 * ============================================================
 * STORAGE DTOs - File Upload Data Transfer Objects
 * ServiceOS - SaaS Backend - Phase 16
 * ============================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

/**
 * Allowed file types for upload
 */
export enum FileType {
    IMAGE = 'image',
    DOCUMENT = 'document',
    ANY = 'any',
}

/**
 * Allowed MIME types for images
 */
export const ALLOWED_IMAGE_MIMES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
];

/**
 * Allowed MIME types for documents
 */
export const ALLOWED_DOCUMENT_MIMES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
];

/**
 * Maximum file sizes in bytes
 */
export const MAX_FILE_SIZES = {
    IMAGE: 5 * 1024 * 1024,      // 5MB for images
    DOCUMENT: 20 * 1024 * 1024,  // 20MB for documents
    ANY: 50 * 1024 * 1024,       // 50MB for any file
};

/**
 * Upload response DTO
 */
export class UploadResponseDto {
    @ApiProperty({ description: 'Unique file ID' })
    fileId: string;

    @ApiProperty({ description: 'Original filename' })
    originalName: string;

    @ApiProperty({ description: 'Stored filename with extension' })
    storedName: string;

    @ApiProperty({ description: 'MIME type of the file' })
    mimeType: string;

    @ApiProperty({ description: 'File size in bytes' })
    size: number;

    @ApiProperty({ description: 'Public URL to access the file' })
    url: string;

    @ApiProperty({ description: 'Storage bucket name' })
    bucket: string;

    @ApiProperty({ description: 'Upload timestamp' })
    uploadedAt: Date;
}

/**
 * Upload options DTO
 */
export class UploadOptionsDto {
    @ApiPropertyOptional({
        description: 'File type constraint',
        enum: FileType,
        default: FileType.ANY,
    })
    @IsOptional()
    @IsEnum(FileType)
    fileType?: FileType;

    @ApiPropertyOptional({
        description: 'Custom folder path within bucket',
        example: 'avatars',
    })
    @IsOptional()
    @IsString()
    folder?: string;

    @ApiPropertyOptional({
        description: 'Maximum file size in bytes',
    })
    @IsOptional()
    @IsNumber()
    maxSize?: number;
}

/**
 * File metadata stored in database
 */
export class FileMetadataDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    tenantId: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    originalName: string;

    @ApiProperty()
    storedName: string;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    size: number;

    @ApiProperty()
    bucket: string;

    @ApiProperty()
    key: string;

    @ApiProperty()
    url: string;

    @ApiProperty()
    uploadedAt: Date;
}

/**
 * Delete file request DTO
 */
export class DeleteFileDto {
    @ApiProperty({ description: 'File ID to delete' })
    @IsString()
    fileId: string;
}

/**
 * Get signed URL request DTO
 */
export class GetSignedUrlDto {
    @ApiProperty({ description: 'File key/path in storage' })
    @IsString()
    key: string;

    @ApiPropertyOptional({
        description: 'URL expiration time in seconds',
        default: 3600,
    })
    @IsOptional()
    @IsNumber()
    expiresIn?: number;
}
