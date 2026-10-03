import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
// import { AuthGuard } from './auth.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { CreateOtpDto } from '../otp/dto/create-otp.dto.js';
import { OtpService } from '../otp/otp.service.js';

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
	register(@Body() createUserDto: any) {
		return this.usersService.create(createUserDto);
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	async getProfile(@Request() CreateUserDto: any) {
		return this.usersService.findOneByEmail(CreateUserDto.user.email);
	}

	// @UseGuards(LocalAuthGuard)
	@Post('auth/logout')
	async logout(@Request() req: any) {
		await new Promise<void>((resolve, reject) => req.logout((err: any) => (err ? reject(err) : resolve())));
	}

	@HttpCode(HttpStatus.OK)
	@Post('verify')
	otpVerify(@Body() otpDto: CreateOtpDto) {
		return this.otpService.verify(otpDto.code, otpDto.userid);
	}
}
