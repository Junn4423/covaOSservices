/**
 * ============================================================
 * STORAGE MODULE - DB Storage & Optional S3/MinIO
 * ServiceOS - SaaS Backend - Phase 18
 * ============================================================
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { StorageController } from './controllers/storage.controller';
import { StorageService } from './services/storage.service';
import { DbStorageService } from './services/db-storage.service';

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
    providers: [StorageService, DbStorageService],
    exports: [StorageService, DbStorageService],
})
export class StorageModule {}
