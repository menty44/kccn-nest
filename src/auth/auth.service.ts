import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';

type AuthenticatedUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
	) {}

	async signIn(email: string, pass: string): Promise<{ access_token: string }> {
		const user = await this.validateCredentials(email, pass);
		const payload = { sub: user.id, email: user.email };
		return {
			access_token: await this.jwtService.signAsync(payload),
		};
	}

	async validateUser(email: string, pass: string): Promise<AuthenticatedUser> {
		return this.excludePassword(await this.validateCredentials(email, pass));
	}

	async login(user: AuthenticatedUser): Promise<{ access_token: string }> {
		const payload = { email: user.email, sub: user.id };
		return {
			access_token: await this.jwtService.signAsync(payload),
		};
	}

	private async validateCredentials(email: string, pass: string): Promise<User> {
		if (typeof email !== 'string' || typeof pass !== 'string' || !email || !pass) {
			throw new UnauthorizedException('Invalid credentials.');
		}

		const user = await this.usersService.findOneByEmail(email);
		if (!user || !user.isActive || user.isBlocked || !(await bcrypt.compare(pass, user.password))) {
			throw new UnauthorizedException('Invalid credentials.');
		}

		return user;
	}

	private excludePassword(user: User): AuthenticatedUser {
		const authenticatedUser = { ...user };
		delete authenticatedUser.password;
		return authenticatedUser;
	}
}
