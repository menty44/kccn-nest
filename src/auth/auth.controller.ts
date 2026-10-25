import {
	Body,
	BadRequestException,
	Controller,
	Get,
	Headers,
	HttpCode,
	HttpStatus,
	Post,
	Request,
	UnauthorizedException,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateOtpDto } from '../otp/dto/create-otp.dto.js';
import { OtpService } from '../otp/otp.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { RequestOtpDto } from './dto/request-otp.dto.js';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
		private readonly otpService: OtpService,
	) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	signIn(@Body() signInDto: LoginDto) {
		return this.authService.signIn(signInDto.email, signInDto.password);
	}

	@HttpCode(HttpStatus.OK)
	@Post('register')
	register(@Body() createUserDto: CreateUserDto) {
		return this.usersService.create(createUserDto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('reset-password')
	reset(@Body() createUserDto: any) {
		return this.usersService.resetPassword(createUserDto.email);
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	async getProfile(@Request() CreateUserDto: any) {
		return this.usersService.findOneByEmail(CreateUserDto.user.email);
	}

	// @UseGuards(LocalAuthGuard)
	@Post('logout')
	async logout(@Headers('authorization') authorization?: string) {
		const refreshToken = authorization?.replace(/^Bearer\s+/i, '');
		if (!refreshToken) throw new UnauthorizedException('A refresh token is required.');
		await this.authService.revoke(refreshToken);
		return { revoked: true };
	}

	@Post('refresh')
	async refresh(@Body('refresh_token') refreshToken: string) {
		return this.authService.refresh(refreshToken);
	}

	@HttpCode(HttpStatus.OK)
	@Post(['verify', 'otp/verify'])
	otpVerify(@Body() otpDto: CreateOtpDto) {
		return this.otpService.verify(otpDto.code, otpDto.userid);
	}

	@HttpCode(HttpStatus.OK)
	@Post('otp/request')
	requestOtp(@Body() requestOtpDto: RequestOtpDto) {
		const hasEmail = requestOtpDto.email !== undefined;
		const hasUserId = requestOtpDto.userid !== undefined;
		if (hasEmail === hasUserId) {
			throw new BadRequestException('Provide exactly one of email or userid.');
		}
		return this.usersService.requestVerificationOtp(requestOtpDto.email, requestOtpDto.userid);
	}
}
