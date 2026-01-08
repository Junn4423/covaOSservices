/**
 * ============================================================
 * STORAGE SERVICE - MinIO/S3 File Storage
 * ServiceOS - SaaS Backend - Phase 16
 * ============================================================
 * 
 * Handles file upload, download, and management using S3-compatible storage.
 * Compatible with MinIO, AWS S3, DigitalOcean Spaces, etc.
 */

import {
    Injectable,
    Logger,
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import {
    FileType,
    UploadResponseDto,
    ALLOWED_IMAGE_MIMES,
    ALLOWED_DOCUMENT_MIMES,
    MAX_FILE_SIZES,
} from '../dto/storage.dto';

// S3 SDK types - Using dynamic import for flexibility
interface S3Client {
    send: (command: any) => Promise<any>;
}

interface UploadedFile {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private s3Client: S3Client | null = null;
    private isConfigured = false;

    // Configuration
    private endpoint: string;
    private bucket: string;
    private accessKey: string;
    private secretKey: string;
    private region: string;
    private publicUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        // Load configuration
        this.endpoint = this.configService.get<string>('STORAGE_ENDPOINT', '');
        this.bucket = this.configService.get<string>('STORAGE_BUCKET', 'serviceos');
        this.accessKey = this.configService.get<string>('STORAGE_ACCESS_KEY', '');
        this.secretKey = this.configService.get<string>('STORAGE_SECRET_KEY', '');
        this.region = this.configService.get<string>('STORAGE_REGION', 'us-east-1');
        this.publicUrl = this.configService.get<string>('STORAGE_PUBLIC_URL', '');
    }

    async onModuleInit() {
        await this.initializeS3Client();
    }

    /**
     * Initialize S3 client with configuration
     */
    private async initializeS3Client(): Promise<void> {
        if (!this.endpoint || !this.accessKey || !this.secretKey) {
            this.logger.warn(
                'Storage not configured. Set STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY env vars.',
            );
            return;
        }

        try {
            // Dynamic import of AWS SDK
            const { S3Client: AwsS3Client } = await import('@aws-sdk/client-s3');

            this.s3Client = new AwsS3Client({
                endpoint: this.endpoint,
                region: this.region,
                credentials: {
                    accessKeyId: this.accessKey,
                    secretAccessKey: this.secretKey,
                },
                forcePathStyle: true, // Required for MinIO
            });

            this.isConfigured = true;
            this.logger.log(`Storage initialized: ${this.endpoint}/${this.bucket}`);
        } catch (error) {
            this.logger.error('Failed to initialize S3 client:', error);
        }
    }

    /**
     * Check if storage is properly configured
     */
    isStorageConfigured(): boolean {
        return this.isConfigured && this.s3Client !== null;
    }

    /**
     * Upload a file to storage
     */
    async uploadFile(
        file: UploadedFile,
        tenantId: string,
        userId: string,
        options?: {
            fileType?: FileType;
            folder?: string;
            maxSize?: number;
        },
    ): Promise<UploadResponseDto> {
        // Validate storage configuration
        if (!this.isStorageConfigured()) {
            throw new InternalServerErrorException(
                'Storage service is not configured. Please contact administrator.',
            );
        }

        const { fileType = FileType.ANY, folder = '', maxSize } = options || {};

        // Validate file type
        this.validateFileType(file.mimetype, fileType);

        // Validate file size
        this.validateFileSize(file.size, fileType, maxSize);

        // Generate unique filename
        const fileId = uuidv4();
        const ext = this.getFileExtension(file.originalname);
        const storedName = `${fileId}${ext}`;

        // Build storage key with tenant isolation
        const key = this.buildStorageKey(tenantId, folder, storedName);

        try {
            // Upload to S3/MinIO
            const { PutObjectCommand } = await import('@aws-sdk/client-s3');
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                Metadata: {
                    'original-name': encodeURIComponent(file.originalname),
                    'tenant-id': tenantId,
                    'user-id': userId,
                },
            });

            await this.s3Client!.send(command);

            // Build public URL
            const url = this.buildPublicUrl(key);

            // Store metadata in database
            await this.saveFileMetadata({
                id: fileId,
                tenantId,
                userId,
                originalName: file.originalname,
                storedName,
                mimeType: file.mimetype,
                size: file.size,
                bucket: this.bucket,
                key,
                url,
            });

            this.logger.log(`File uploaded: ${key} by user ${userId}`);

            return {
                fileId,
                originalName: file.originalname,
                storedName,
                mimeType: file.mimetype,
                size: file.size,
                url,
                bucket: this.bucket,
                uploadedAt: new Date(),
            };
        } catch (error) {
            this.logger.error('Failed to upload file:', error);
            throw new InternalServerErrorException('Failed to upload file');
        }
    }

    /**
     * Delete a file from storage
     */
    async deleteFile(fileId: string, tenantId: string): Promise<void> {
        if (!this.isStorageConfigured()) {
            throw new InternalServerErrorException('Storage service is not configured');
        }

        // Get file metadata
        const metadata = await this.getFileMetadata(fileId, tenantId);
        if (!metadata) {
            throw new NotFoundException('File not found');
        }

        try {
            const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
            const command = new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: metadata.key,
            });

            await this.s3Client!.send(command);

            // Remove from database
            await this.removeFileMetadata(fileId, tenantId);

            this.logger.log(`File deleted: ${metadata.key}`);
        } catch (error) {
            this.logger.error('Failed to delete file:', error);
            throw new InternalServerErrorException('Failed to delete file');
        }
    }

    /**
     * Get a signed URL for temporary access
     */
    async getSignedUrl(
        key: string,
        expiresIn: number = 3600,
    ): Promise<string> {
        if (!this.isStorageConfigured()) {
            throw new InternalServerErrorException('Storage service is not configured');
        }

        try {
            const { GetObjectCommand } = await import('@aws-sdk/client-s3');
            const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            return await getSignedUrl(this.s3Client as any, command, { expiresIn });
        } catch (error) {
            this.logger.error('Failed to generate signed URL:', error);
            throw new InternalServerErrorException('Failed to generate signed URL');
        }
    }

    /**
     * Get file metadata from database
     */
    async getFileMetadata(
        fileId: string,
        tenantId: string,
    ): Promise<{
        id: string;
        key: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
    } | null> {
        const file = await this.prisma.runAsSystem(async () => {
            return this.prisma.tapTin.findFirst({
                where: {
                    id: fileId,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
            });
        });

        if (!file) return null;

        // Handle nullable duong_dan for DB storage
        const key = file.duong_dan || '';
        
        return {
            id: file.id,
            key,
            originalName: file.ten_goc,
            mimeType: file.loai_tap_tin,
            size: file.kich_thuoc,
            url: file.url_cong_khai || (key ? this.buildPublicUrl(key) : ''),
        };
    }

    /**
     * List files for a tenant
     */
    async listFiles(
        tenantId: string,
        options?: {
            folder?: string;
            page?: number;
            limit?: number;
        },
    ) {
        const { folder, page = 1, limit = 20 } = options || {};
        const skip = (page - 1) * limit;

        const where: any = {
            id_doanh_nghiep: tenantId,
            ngay_xoa: null,
        };

        if (folder) {
            where.duong_dan = { startsWith: `${tenantId}/${folder}/` };
        }

        const [files, total] = await Promise.all([
            this.prisma.tapTin.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
            }),
            this.prisma.tapTin.count({ where }),
        ]);

        return {
            data: files.map((f) => ({
                id: f.id,
                originalName: f.ten_goc,
                storedName: f.ten_luu_tru,
                mimeType: f.loai_tap_tin,
                size: f.kich_thuoc,
                url: f.url_cong_khai || (f.duong_dan ? this.buildPublicUrl(f.duong_dan) : ''),
                uploadedAt: f.ngay_tao,
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ============================================================
    // Private Helper Methods
    // ============================================================

    /**
     * Validate file MIME type
     */
    private validateFileType(mimeType: string, fileType: FileType): void {
        if (fileType === FileType.ANY) return;

        const allowedMimes =
            fileType === FileType.IMAGE
                ? ALLOWED_IMAGE_MIMES
                : ALLOWED_DOCUMENT_MIMES;

        if (!allowedMimes.includes(mimeType)) {
            throw new BadRequestException(
                `Invalid file type. Allowed: ${allowedMimes.join(', ')}`,
            );
        }
    }

    /**
     * Validate file size
     */
    private validateFileSize(
        size: number,
        fileType: FileType,
        customMaxSize?: number,
    ): void {
        const maxSize = customMaxSize || MAX_FILE_SIZES[fileType.toUpperCase()] || MAX_FILE_SIZES.ANY;

        if (size > maxSize) {
            const maxMB = Math.round(maxSize / (1024 * 1024));
            throw new BadRequestException(
                `File too large. Maximum size: ${maxMB}MB`,
            );
        }
    }

    /**
     * Get file extension from filename
     */
    private getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.slice(lastDot) : '';
    }

    /**
     * Build storage key with tenant isolation
     */
    private buildStorageKey(
        tenantId: string,
        folder: string,
        filename: string,
    ): string {
        const parts = [tenantId];
        if (folder) parts.push(folder);
        parts.push(filename);
        return parts.join('/');
    }

    /**
     * Build public URL for a storage key
     */
    private buildPublicUrl(key: string): string {
        if (this.publicUrl) {
            return `${this.publicUrl}/${key}`;
        }
        return `${this.endpoint}/${this.bucket}/${key}`;
    }

    /**
     * Save file metadata to database
     */
    private async saveFileMetadata(metadata: {
        id: string;
        tenantId: string;
        userId: string;
        originalName: string;
        storedName: string;
        mimeType: string;
        size: number;
        bucket: string;
        key: string;
        url: string;
    }): Promise<void> {
        await this.prisma.runAsSystem(async () => {
            return this.prisma.tapTin.create({
                data: {
                    id: metadata.id,
                    id_doanh_nghiep: metadata.tenantId,
                    nguoi_tao_id: metadata.userId,
                    ten_goc: metadata.originalName,
                    ten_luu_tru: metadata.storedName,
                    loai_tap_tin: metadata.mimeType,
                    kich_thuoc: metadata.size,
                    bucket: metadata.bucket,
                    duong_dan: metadata.key,
                    url_cong_khai: metadata.url,
                },
            });
        });
    }

    /**
     * Remove file metadata from database (soft delete)
     */
    private async removeFileMetadata(
        fileId: string,
        tenantId: string,
    ): Promise<void> {
        await this.prisma.runAsSystem(async () => {
            return this.prisma.tapTin.updateMany({
                where: {
                    id: fileId,
                    id_doanh_nghiep: tenantId,
                },
                data: {
                    ngay_xoa: new Date(),
                },
            });
        });
    }
}
