/**
 * ============================================================
 * AUTH CONTROLLER - Authentication Endpoints
 * ServiceOS - SaaS Backend
 * ============================================================
 */

import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';
import { AuthService, LoginDto } from '../services/auth.service';
import { JwtAuthGuard, Public, ActiveUser } from '@libs/common';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @Public()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Đăng nhập' })
    @ApiBody({
        schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
                email: { type: 'string', example: 'admin@example.com' },
                password: { type: 'string', example: 'password123' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Đăng nhập thành công',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string' },
                refresh_token: { type: 'string' },
                expires_in: { type: 'number' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        ho_ten: { type: 'string' },
                        vai_tro: { type: 'string' },
                    },
                },
            },
        },
    })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Thông tin đăng nhập không đúng' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin profile' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Thông tin profile' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Chưa đăng nhập' })
    async getProfile(@ActiveUser('id') userId: string) {
        return this.authService.getProfile(userId);
    }
}
