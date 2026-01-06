/**
 * Auth Controller - API Endpoints cho xác thực
 */

import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, LoginDto, RegisterDto } from '../services/auth.service';
import { Public, ActiveUser, ActiveUserData } from '@libs/common';
import { JwtAuthGuard } from '@libs/common';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Đăng nhập' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Đăng ký doanh nghiệp mới' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
    async getProfile(@ActiveUser() user: ActiveUserData) {
        return user;
    }

    @UseGuards(JwtAuthGuard)
    @Post('refresh')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Refresh token' })
    async refreshToken(@ActiveUser() user: ActiveUserData) {
        return this.authService.refreshToken(
            user.id,
            user.id_doanh_nghiep,
            user.email,
            user.ho_ten,
            user.vai_tro,
        );
    }
}
