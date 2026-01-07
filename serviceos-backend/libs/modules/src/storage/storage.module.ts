/**
 * ============================================================
 * STORAGE MODULE - MinIO/S3 Integration
 * ServiceOS - SaaS Backend - Phase 16
 * ============================================================
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';

@Module({
    imports: [
        ConfigModule,
        MulterModule.register({
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB max
            },
        }),
    ],
    controllers: [StorageController],
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule {}
