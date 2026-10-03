import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
// import { AuthGuard } from './auth.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { log } from 'console';
import { CreateUserDto } from '../users/dto/create-user.dto.js';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
	) {}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	signIn(@Body() signInDto: Record<string, any>) {
		log(signInDto);
		return this.authService.signIn(signInDto.username, signInDto.password);
	}

	@HttpCode(HttpStatus.OK)
	@Post('register')
	register(@Body() createUserDto: CreateUserDto) {
		log(createUserDto);
		return this.usersService.create(createUserDto);
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	getProfile(@Request() req) {
		return req.user;
	}

	// @UseGuards(LocalAuthGuard)
	@Post('auth/logout')
	async logout(@Request() req: any) {
		await new Promise<void>((resolve, reject) => req.logout((err: any) => (err ? reject(err) : resolve())));
	}
}
