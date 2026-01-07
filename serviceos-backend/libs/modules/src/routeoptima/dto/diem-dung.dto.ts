/**
 * ============================================================
 * DTOs - RouteOptima Module (Diem Dung - Stop Management)
 * ServiceOS - SaaS Backend
 * ============================================================
 *
 * Stop DTOs:
 * - Update stop status
 * - Record actual arrival
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsNotEmpty,
    IsNumber,
    Min,
    Max,
    IsInt,
    IsDateString,
    IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TrangThaiDiemDung } from './lo-trinh.dto';

// ============================================================
// UPDATE STOP STATUS DTO
// ============================================================

/**
 * DTO to update stop status (mark as visited/skipped)
 */
export class UpdateStopStatusDto {
    @ApiProperty({
        description: 'New status (1=Visited, 2=Skipped)',
        enum: [TrangThaiDiemDung.VISITED, TrangThaiDiemDung.SKIPPED],
        example: 1,
    })
    @IsNotEmpty({ message: 'Trang thai khong duoc de trong' })
    @Type(() => Number)
    @IsInt({ message: 'Trang thai phai la so nguyen' })
    @IsEnum([TrangThaiDiemDung.VISITED, TrangThaiDiemDung.SKIPPED], {
        message: 'Trang thai phai la 1 (Visited) hoac 2 (Skipped)',
    })
    trang_thai: TrangThaiDiemDung;

    @ApiPropertyOptional({
        description: 'Actual arrival time (ISO DateTime). Defaults to now.',
        example: '2026-01-07T09:15:00',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Thoi gian den thuc te phai la dinh dang ISO' })
    thoi_gian_den_thuc_te?: string;

    @ApiPropertyOptional({
        description: 'Actual latitude when arrived',
        example: 10.762622,
        minimum: -90,
        maximum: 90,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Toa do lat phai la so' })
    @Min(-90, { message: 'Latitude phai trong khoang -90 den 90' })
    @Max(90, { message: 'Latitude phai trong khoang -90 den 90' })
    @Type(() => Number)
    toa_do_thuc_te_lat?: number;

    @ApiPropertyOptional({
        description: 'Actual longitude when arrived',
        example: 106.660172,
        minimum: -180,
        maximum: 180,
    })
    @IsOptional()
    @IsNumber({}, { message: 'Toa do lng phai la so' })
    @Min(-180, { message: 'Longitude phai trong khoang -180 den 180' })
    @Max(180, { message: 'Longitude phai trong khoang -180 den 180' })
    @Type(() => Number)
    toa_do_thuc_te_lng?: number;

    @ApiPropertyOptional({
        description: 'Departure time (ISO DateTime)',
        example: '2026-01-07T09:45:00',
    })
    @IsOptional()
    @IsDateString({}, { message: 'Thoi gian roi di phai la dinh dang ISO' })
    thoi_gian_roi_di?: string;
}

// ============================================================
// RESPONSE DTOs
// ============================================================

/**
 * Response for stop update
 */
export class UpdateStopResponseDto {
    @ApiProperty({ description: 'Success message' })
    message: string;

    @ApiProperty({ description: 'Updated stop data' })
    data: any;

    @ApiProperty({ description: 'Is route completed?', example: false })
    route_completed: boolean;
}
