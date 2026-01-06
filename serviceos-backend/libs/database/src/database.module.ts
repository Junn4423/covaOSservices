/**
 * ============================================================
 * DATABASE MODULE
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Module này export PrismaService dưới dạng Global module
 * để các module khác có thể inject mà không cần import
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class DatabaseModule { }
