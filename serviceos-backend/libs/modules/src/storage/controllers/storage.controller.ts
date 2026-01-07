/**
 * ============================================================
 * STORAGE CONTROLLER - File Upload API
 * ServiceOS - SaaS Backend - Phase 16
 * ============================================================
 * 
 * REST API endpoints for file upload and management.
 * Supports multipart/form-data uploads with validation.
 */

import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Query,
    Body,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiBearerAuth,
    ApiResponse,
    ApiQuery,
} from '@nestjs/swagger';
import { ActiveUser, TenantId, UserId } from '@libs/common';
import { StorageService } from '../services/storage.service';
import {
    FileType,
    UploadResponseDto,
    DeleteFileDto,
    GetSignedUrlDto,
    MAX_FILE_SIZES,
} from '../dto/storage.dto';

@ApiTags('Storage')
@ApiBearerAuth()
@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) {}

    // ============================================================
    // UPLOAD SINGLE FILE
    // ============================================================
    @Post('upload')
    @ApiOperation({
        summary: 'Upload a single file',
        description: 'Upload a file (image or document) to storage. Returns public URL.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to upload (image/pdf)',
                },
                folder: {
                    type: 'string',
                    description: 'Optional folder path (e.g., avatars, documents)',
                },
                fileType: {
                    type: 'string',
                    enum: ['image', 'document', 'any'],
                    description: 'File type constraint for validation',
                },
            },
            required: ['file'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        type: UploadResponseDto,
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @TenantId() tenantId: string,
        @UserId() userId: string,
        @Body('folder') folder?: string,
        @Body('fileType') fileType?: FileType,
    ): Promise<UploadResponseDto> {
        return this.storageService.uploadFile(
            {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                buffer: file.buffer,
            },
            tenantId,
            userId,
            { folder, fileType },
        );
    }

    // ============================================================
    // UPLOAD IMAGE (Specialized endpoint with stricter validation)
    // ============================================================
    @Post('upload/image')
    @ApiOperation({
        summary: 'Upload an image file',
        description: 'Upload an image file (JPEG, PNG, GIF, WebP, SVG). Max 5MB.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file to upload',
                },
                folder: {
                    type: 'string',
                    description: 'Optional folder path (e.g., avatars, products)',
                },
            },
            required: ['file'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZES.IMAGE }),
                    new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp|svg\+xml)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
        @TenantId() tenantId: string,
        @UserId() userId: string,
        @Body('folder') folder?: string,
    ): Promise<UploadResponseDto> {
        return this.storageService.uploadFile(
            {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                buffer: file.buffer,
            },
            tenantId,
            userId,
            { folder: folder || 'images', fileType: FileType.IMAGE },
        );
    }

    // ============================================================
    // UPLOAD DOCUMENT (PDF, Word, Excel)
    // ============================================================
    @Post('upload/document')
    @ApiOperation({
        summary: 'Upload a document file',
        description: 'Upload a document file (PDF, Word, Excel, CSV). Max 20MB.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Document file to upload',
                },
                folder: {
                    type: 'string',
                    description: 'Optional folder path (e.g., contracts, invoices)',
                },
            },
            required: ['file'],
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadDocument(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZES.DOCUMENT }),
                ],
            }),
        )
        file: Express.Multer.File,
        @TenantId() tenantId: string,
        @UserId() userId: string,
        @Body('folder') folder?: string,
    ): Promise<UploadResponseDto> {
        return this.storageService.uploadFile(
            {
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                buffer: file.buffer,
            },
            tenantId,
            userId,
            { folder: folder || 'documents', fileType: FileType.DOCUMENT },
        );
    }

    // ============================================================
    // UPLOAD MULTIPLE FILES
    // ============================================================
    @Post('upload/multiple')
    @ApiOperation({
        summary: 'Upload multiple files',
        description: 'Upload up to 10 files at once. Returns array of URLs.',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: {
                    type: 'array',
                    items: { type: 'string', format: 'binary' },
                    description: 'Files to upload (max 10)',
                },
                folder: {
                    type: 'string',
                    description: 'Optional folder path',
                },
            },
            required: ['files'],
        },
    })
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadMultipleFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @TenantId() tenantId: string,
        @UserId() userId: string,
        @Body('folder') folder?: string,
    ): Promise<UploadResponseDto[]> {
        const results = await Promise.all(
            files.map((file) =>
                this.storageService.uploadFile(
                    {
                        originalname: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                        buffer: file.buffer,
                    },
                    tenantId,
                    userId,
                    { folder },
                ),
            ),
        );

        return results;
    }

    // ============================================================
    // LIST FILES
    // ============================================================
    @Get()
    @ApiOperation({
        summary: 'List uploaded files',
        description: 'Get a paginated list of uploaded files for the tenant.',
    })
    @ApiQuery({ name: 'folder', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async listFiles(
        @TenantId() tenantId: string,
        @Query('folder') folder?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.storageService.listFiles(tenantId, {
            folder,
            page: page || 1,
            limit: limit || 20,
        });
    }

    // ============================================================
    // GET FILE INFO
    // ============================================================
    @Get(':fileId')
    @ApiOperation({
        summary: 'Get file information',
        description: 'Get metadata for a specific file.',
    })
    async getFileInfo(
        @Param('fileId') fileId: string,
        @TenantId() tenantId: string,
    ) {
        const metadata = await this.storageService.getFileMetadata(fileId, tenantId);
        if (!metadata) {
            return { error: 'File not found' };
        }
        return metadata;
    }

    // ============================================================
    // GET SIGNED URL
    // ============================================================
    @Post('signed-url')
    @ApiOperation({
        summary: 'Get a signed URL for private file access',
        description: 'Generate a temporary signed URL for accessing private files.',
    })
    async getSignedUrl(
        @Body() dto: GetSignedUrlDto,
        @TenantId() tenantId: string,
    ) {
        const url = await this.storageService.getSignedUrl(
            dto.key,
            dto.expiresIn || 3600,
        );
        return { url, expiresIn: dto.expiresIn || 3600 };
    }

    // ============================================================
    // DELETE FILE
    // ============================================================
    @Delete(':fileId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete a file',
        description: 'Delete a file from storage. This action cannot be undone.',
    })
    async deleteFile(
        @Param('fileId') fileId: string,
        @TenantId() tenantId: string,
    ): Promise<void> {
        await this.storageService.deleteFile(fileId, tenantId);
    }

    // ============================================================
    // CHECK STORAGE STATUS
    // ============================================================
    @Get('status/health')
    @ApiOperation({
        summary: 'Check storage service status',
        description: 'Check if the storage service is properly configured and available.',
    })
    async checkStorageStatus() {
        const isConfigured = this.storageService.isStorageConfigured();
        return {
            status: isConfigured ? 'healthy' : 'not_configured',
            message: isConfigured
                ? 'Storage service is available'
                : 'Storage service is not configured. Set STORAGE_* environment variables.',
        };
    }
}
