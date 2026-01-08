/**
 * ============================================================
 * DB STORAGE SERVICE - Luu tru anh truc tiep vao Database
 * ServiceOS - SaaS Backend - Phase 18
 * ============================================================
 * 
 * Thay the MinIO/S3 bang cach luu anh vao Database dang Base64.
 * Su dung Sharp de nen anh truoc khi luu.
 */

import {
    Injectable,
    Logger,
    BadRequestException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@libs/database';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import {
    FileType,
    UploadResponseDto,
    ALLOWED_IMAGE_MIMES,
    MAX_FILE_SIZES,
} from '../dto/storage.dto';

interface UploadedFile {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}

@Injectable()
export class DbStorageService {
    private readonly logger = new Logger(DbStorageService.name);

    // Cau hinh nen anh
    private readonly MAX_WIDTH = 800;
    private readonly QUALITY = 60;
    private readonly MAX_COMPRESSED_SIZE = 100 * 1024; // 100KB

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Kiem tra service san sang
     */
    isStorageConfigured(): boolean {
        return true; // DB storage luon san sang
    }

    /**
     * Upload file vao Database (Base64)
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
        const { fileType = FileType.IMAGE, maxSize } = options || {};

        // Chi ho tro anh cho DB storage
        if (fileType !== FileType.IMAGE && !ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
            throw new BadRequestException(
                'Luu tru Database chi ho tro file anh. Vui long su dung S3/MinIO cho cac loai file khac.',
            );
        }

        // Validate file type
        this.validateFileType(file.mimetype);

        // Validate file size truoc khi xu ly
        this.validateFileSize(file.size, maxSize);

        // Generate unique ID
        const fileId = uuidv4();
        const ext = this.getFileExtension(file.originalname);
        const storedName = `${fileId}${ext}`;

        try {
            // Nen anh bang Sharp
            const compressedBuffer = await this.compressImage(file.buffer, file.mimetype);
            
            // Convert sang Base64 voi data URI
            const base64Data = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

            // Luu vao Database
            await this.prisma.runAsSystem(async () => {
                return this.prisma.tapTin.create({
                    data: {
                        id: fileId,
                        id_doanh_nghiep: tenantId,
                        nguoi_tao_id: userId,
                        ten_goc: file.originalname,
                        ten_luu_tru: storedName,
                        loai_tap_tin: 'image/jpeg', // Sau khi nen luon la JPEG
                        kich_thuoc: compressedBuffer.length,
                        bucket: 'database', // Danh dau la luu trong DB
                        duong_dan: null,
                        url_cong_khai: null,
                        du_lieu_base64: base64Data,
                    },
                });
            });

            // URL truy cap anh
            const url = `/api/v1/storage/render/${fileId}`;

            this.logger.log(
                `Da luu anh vao DB: ${fileId} (${file.originalname}) - ` +
                `Goc: ${(file.size / 1024).toFixed(1)}KB -> Nen: ${(compressedBuffer.length / 1024).toFixed(1)}KB`,
            );

            return {
                fileId,
                originalName: file.originalname,
                storedName,
                mimeType: 'image/jpeg',
                size: compressedBuffer.length,
                url,
                bucket: 'database',
                uploadedAt: new Date(),
            };
        } catch (error) {
            this.logger.error('Loi upload file:', error);
            throw new InternalServerErrorException('Khong the upload file. Vui long thu lai.');
        }
    }

    /**
     * Nen anh su dung Sharp
     */
    private async compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
        try {
            let sharpInstance = sharp(buffer);

            // Lay metadata de kiem tra kich thuoc
            const metadata = await sharpInstance.metadata();
            
            // Resize neu qua lon
            if (metadata.width && metadata.width > this.MAX_WIDTH) {
                sharpInstance = sharpInstance.resize(this.MAX_WIDTH, null, {
                    withoutEnlargement: true,
                    fit: 'inside',
                });
            }

            // Convert sang JPEG voi quality thap de giam dung luong
            let compressedBuffer = await sharpInstance
                .jpeg({ quality: this.QUALITY, progressive: true })
                .toBuffer();

            // Neu van qua lon, giam quality them
            if (compressedBuffer.length > this.MAX_COMPRESSED_SIZE) {
                compressedBuffer = await sharp(buffer)
                    .resize(this.MAX_WIDTH, null, { withoutEnlargement: true, fit: 'inside' })
                    .jpeg({ quality: 40, progressive: true })
                    .toBuffer();
            }

            return compressedBuffer;
        } catch (error) {
            this.logger.error('Loi nen anh:', error);
            // Fallback: tra ve buffer goc neu khong the nen
            return buffer;
        }
    }

    /**
     * Lay anh tu Database va tra ve Buffer
     */
    async getFileBuffer(fileId: string): Promise<{
        buffer: Buffer;
        mimeType: string;
        originalName: string;
    } | null> {
        const file = await this.prisma.runAsSystem(async () => {
            return this.prisma.tapTin.findFirst({
                where: {
                    id: fileId,
                    ngay_xoa: null,
                    du_lieu_base64: { not: null },
                },
            });
        });

        if (!file || !file.du_lieu_base64) {
            return null;
        }

        // Parse Base64 data URI
        const base64Data = file.du_lieu_base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        return {
            buffer,
            mimeType: file.loai_tap_tin,
            originalName: file.ten_goc,
        };
    }

    /**
     * Lay metadata cua file
     */
    async getFileMetadata(
        fileId: string,
        tenantId?: string,
    ): Promise<{
        id: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
        isDbStorage: boolean;
    } | null> {
        const where: any = {
            id: fileId,
            ngay_xoa: null,
        };

        if (tenantId) {
            where.id_doanh_nghiep = tenantId;
        }

        const file = await this.prisma.runAsSystem(async () => {
            return this.prisma.tapTin.findFirst({ where });
        });

        if (!file) return null;

        const isDbStorage = file.bucket === 'database' && !!file.du_lieu_base64;

        return {
            id: file.id,
            originalName: file.ten_goc,
            mimeType: file.loai_tap_tin,
            size: file.kich_thuoc,
            url: isDbStorage 
                ? `/api/v1/storage/render/${file.id}`
                : file.url_cong_khai || '',
            isDbStorage,
        };
    }

    /**
     * Xoa file
     */
    async deleteFile(fileId: string, tenantId: string): Promise<void> {
        const file = await this.prisma.runAsSystem(async () => {
            return this.prisma.tapTin.findFirst({
                where: {
                    id: fileId,
                    id_doanh_nghiep: tenantId,
                    ngay_xoa: null,
                },
            });
        });

        if (!file) {
            throw new NotFoundException('Khong tim thay file');
        }

        // Soft delete
        await this.prisma.runAsSystem(async () => {
            return this.prisma.tapTin.update({
                where: { id: fileId },
                data: { 
                    ngay_xoa: new Date(),
                    du_lieu_base64: null, // Xoa du lieu de giai phong dung luong
                },
            });
        });

        this.logger.log(`Da xoa file: ${fileId}`);
    }

    /**
     * Danh sach file
     */
    async listFiles(
        tenantId: string,
        options?: {
            page?: number;
            limit?: number;
        },
    ) {
        const { page = 1, limit = 20 } = options || {};
        const skip = (page - 1) * limit;

        const where = {
            id_doanh_nghiep: tenantId,
            ngay_xoa: null,
        };

        const [files, total] = await Promise.all([
            this.prisma.tapTin.findMany({
                where,
                skip,
                take: limit,
                orderBy: { ngay_tao: 'desc' },
                select: {
                    id: true,
                    ten_goc: true,
                    ten_luu_tru: true,
                    loai_tap_tin: true,
                    kich_thuoc: true,
                    bucket: true,
                    ngay_tao: true,
                },
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
                url: f.bucket === 'database' 
                    ? `/api/v1/storage/render/${f.id}`
                    : '',
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

    private validateFileType(mimeType: string): void {
        if (!ALLOWED_IMAGE_MIMES.includes(mimeType)) {
            throw new BadRequestException(
                `Loai file khong hop le. Chi chap nhan: ${ALLOWED_IMAGE_MIMES.join(', ')}`,
            );
        }
    }

    private validateFileSize(size: number, customMaxSize?: number): void {
        const maxSize = customMaxSize || MAX_FILE_SIZES.IMAGE;

        if (size > maxSize) {
            const maxMB = Math.round(maxSize / (1024 * 1024));
            throw new BadRequestException(
                `File qua lon. Dung luong toi da: ${maxMB}MB`,
            );
        }
    }

    private getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.slice(lastDot) : '';
    }
}
