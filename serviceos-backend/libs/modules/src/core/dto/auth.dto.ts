import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

// DTO for login requests - accepts both password and mat_khau for backward compatibility
export class LoginRequestDto {
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@IsOptional()
	@IsString()
	@MinLength(6)
	password?: string;

	@IsOptional()
	@IsString()
	@MinLength(6)
	mat_khau?: string;
}

// DTO for tenant registration including admin bootstrap user
export class RegisterTenantDto {
	@IsString()
	@IsNotEmpty()
	ten_doanh_nghiep: string;

	@IsString()
	@IsNotEmpty()
	ma_doanh_nghiep: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsString()
	so_dien_thoai?: string;

	@IsOptional()
	@IsString()
	dia_chi?: string;

	@IsOptional()
	@IsString()
	goi_cuoc?: string;

	@ValidateIf((dto) => dto.admin_email !== undefined)
	@IsEmail()
	@IsNotEmpty()
	admin_email?: string;

	@ValidateIf((dto) => dto.admin_email !== undefined)
	@IsString()
	@IsNotEmpty()
	admin_ho_ten?: string;

	@ValidateIf((dto) => dto.admin_email !== undefined)
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	mat_khau?: string;
}

// DTO for refreshing access tokens
export class RefreshTokenDto {
	@IsString()
	@IsNotEmpty()
	refresh_token: string;
}
