import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';

type AuthenticatedUser = Omit<User, 'password'>;
const ACCESS_TOKEN_TTL_SECONDS = 5 * 60 * 60;

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
		@InjectRepository(Session) private readonly sessions: Repository<Session>,
	) {}

	async signIn(
		email: string,
		pass: string,
	): Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: string }> {
		const user = await this.validateCredentials(email, pass);
		return this.createSession(user);
	}

	async refresh(
		refreshToken: string,
	): Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: string }> {
		const [sessionId, secret] = refreshToken.split('.');
		if (!sessionId || !secret) throw new UnauthorizedException('Invalid refresh token.');
		const session = await this.sessions.findOneBy({ id: sessionId });
		if (
			!session ||
			session.revokedAt ||
			session.expiresAt <= new Date() ||
			!(await bcrypt.compare(secret, session.refreshHash))
		) {
			if (session) await this.revokeFamily(session.familyId);
			throw new UnauthorizedException('Invalid refresh token.');
		}
		const user = await this.usersService.findOne(session.userId);
		if (!user || !user.isActive || user.isBlocked) throw new UnauthorizedException('Invalid refresh token.');
		session.revokedAt = new Date();
		await this.sessions.save(session);
		return this.createSession(user, session.familyId);
	}

	async revoke(refreshToken: string): Promise<void> {
		const [sessionId] = refreshToken.split('.');
		if (!sessionId) return;
		const session = await this.sessions.findOneBy({ id: sessionId });
		if (session && !session.revokedAt) {
			session.revokedAt = new Date();
			await this.sessions.save(session);
		}
	}

	async validateUser(email: string, pass: string): Promise<AuthenticatedUser> {
		return this.excludePassword(await this.validateCredentials(email, pass));
	}

	async login(
		user: AuthenticatedUser,
	): Promise<{ access_token: string; refresh_token: string; expires_in: number; token_type: string }> {
		return this.createSession(user);
	}

	private async createSession(user: AuthenticatedUser, familyId: string = randomUUID()) {
		const secret = randomBytes(32).toString('base64url');
		const session = await this.sessions.save(
			this.sessions.create({
				userId: user.id,
				refreshHash: await bcrypt.hash(secret, 12),
				familyId,
				expiresAt: new Date(Date.now() + 30 * 864e5),
				revokedAt: null,
			}),
		);
		const payload = {
			email: user.email,
			sub: user.id,
			roles: user.isAdmin ? ['admin'] : ['member'],
			sid: session.id,
		};
		return {
			access_token: await this.jwtService.signAsync(payload),
			refresh_token: `${session.id}.${secret}`,
			expires_in: ACCESS_TOKEN_TTL_SECONDS,
			token_type: 'Bearer',
		};
	}

	private async revokeFamily(familyId: string): Promise<void> {
		const family = await this.sessions.find({ where: { familyId, revokedAt: null } });
		await Promise.all(family.map((session) => this.sessions.save({ ...session, revokedAt: new Date() })));
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
