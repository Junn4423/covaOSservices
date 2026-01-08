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

    // Cau hinh nen anh - can bang giua dung luong va chat luong
    private readonly MAX_WIDTH = 1200;          // Tang len cho chat luong tot hon
    private readonly MAX_HEIGHT = 1200;         // Gioi han chieu cao
    private readonly QUALITY_HIGH = 80;         // Chat luong cao cho anh nho
    private readonly QUALITY_MEDIUM = 65;       // Chat luong trung binh
    private readonly QUALITY_LOW = 50;          // Chat luong thap cho anh lon
    private readonly MAX_COMPRESSED_SIZE = 200 * 1024; // 200KB - tang len mot chut
    private readonly TARGET_SIZE = 150 * 1024;  // 150KB - muc tieu

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
            // Nen anh bang Sharp - adaptive compression
            const compressedBuffer = await this.compressImage(file.buffer, file.mimetype);
            
            // Xac dinh output format
            const outputMime = file.mimetype === 'image/png' ? 'image/png' : 'image/jpeg';
            
            // Convert sang Base64 voi data URI
            const base64Data = `data:${outputMime};base64,${compressedBuffer.toString('base64')}`;

            // Luu vao Database
            await this.prisma.runAsSystem(async () => {
                return this.prisma.tapTin.create({
                    data: {
                        id: fileId,
                        id_doanh_nghiep: tenantId,
                        nguoi_tao_id: userId,
                        ten_goc: file.originalname,
                        ten_luu_tru: storedName,
                        loai_tap_tin: outputMime,
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
                `Goc: ${(file.size / 1024).toFixed(1)}KB -> Nen: ${(compressedBuffer.length / 1024).toFixed(1)}KB (${outputMime})`,
            );

            return {
                fileId,
                originalName: file.originalname,
                storedName,
                mimeType: outputMime,
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
     * Nen anh su dung Sharp - Adaptive compression
     * Giu chat luong tot nhat co the trong gioi han dung luong
     */
    private async compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
        try {
            const metadata = await sharp(buffer).metadata();
            const originalSize = buffer.length;

            // Tinh toan kich thuoc moi (giu ty le)
            let width = metadata.width || this.MAX_WIDTH;
            let height = metadata.height || this.MAX_HEIGHT;

            if (width > this.MAX_WIDTH || height > this.MAX_HEIGHT) {
                const ratio = Math.min(
                    this.MAX_WIDTH / width,
                    this.MAX_HEIGHT / height
                );
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            // Xac dinh format output - uu tien WebP neu browser ho tro
            const outputFormat = mimeType === 'image/png' ? 'png' : 'jpeg';

            // Thu nen voi chat luong cao truoc
            let compressedBuffer = await this.compressWithQuality(
                buffer, width, height, this.QUALITY_HIGH, outputFormat
            );

            // Neu van qua lon, giam chat luong dan
            if (compressedBuffer.length > this.MAX_COMPRESSED_SIZE) {
                compressedBuffer = await this.compressWithQuality(
                    buffer, width, height, this.QUALITY_MEDIUM, outputFormat
                );
            }

            if (compressedBuffer.length > this.MAX_COMPRESSED_SIZE) {
                compressedBuffer = await this.compressWithQuality(
                    buffer, width, height, this.QUALITY_LOW, outputFormat
                );
            }

            // Neu van qua lon, giam kich thuoc them
            if (compressedBuffer.length > this.MAX_COMPRESSED_SIZE) {
                const smallerWidth = Math.round(width * 0.7);
                const smallerHeight = Math.round(height * 0.7);
                compressedBuffer = await this.compressWithQuality(
                    buffer, smallerWidth, smallerHeight, this.QUALITY_LOW, outputFormat
                );
            }

            const compressionRatio = ((originalSize - compressedBuffer.length) / originalSize * 100).toFixed(1);
            this.logger.debug(
                `Nen anh: ${(originalSize/1024).toFixed(1)}KB -> ${(compressedBuffer.length/1024).toFixed(1)}KB (giam ${compressionRatio}%)`
            );

            return compressedBuffer;
        } catch (error) {
            this.logger.error('Loi nen anh:', error);
            // Fallback: tra ve buffer goc neu khong the nen
            return buffer;
        }
    }

    /**
     * Helper: Nen anh voi quality cu the
     */
    private async compressWithQuality(
        buffer: Buffer,
        width: number,
        height: number,
        quality: number,
        format: 'jpeg' | 'png'
    ): Promise<Buffer> {
        let sharpInstance = sharp(buffer)
            .resize(width, height, {
                withoutEnlargement: true,
                fit: 'inside',
            });

        if (format === 'png') {
            return sharpInstance
                .png({ quality, compressionLevel: 9 })
                .toBuffer();
        }

        return sharpInstance
            .jpeg({ quality, progressive: true, mozjpeg: true })
            .toBuffer();
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
