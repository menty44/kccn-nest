import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
	let service: AuthService;
	const usersService = {
		findOneByEmail: jest.fn(),
	};
	const jwtService = {
		signAsync: jest.fn(),
	};

	const createUser = (overrides: Partial<User> = {}): User =>
		({
			id: 42,
			email: 'user@example.com',
			password: '$2b$10$placeholder',
			isActive: true,
			isBlocked: false,
			...overrides,
		}) as User;

	beforeEach(async () => {
		jest.resetAllMocks();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UsersService, useValue: usersService },
				{ provide: JwtService, useValue: jwtService },
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
	});

	it('validates bcrypt credentials and excludes the password', async () => {
		const password = 'correct-password';
		const user = createUser({ password: await bcrypt.hash(password, 10) });
		usersService.findOneByEmail.mockResolvedValue(user);

		const validatedUser = await service.validateUser(user.email, password);

		expect(validatedUser).toEqual(
			expect.objectContaining({
				id: user.id,
				email: user.email,
			}),
		);
		expect(validatedUser).not.toHaveProperty('password');
		expect(usersService.findOneByEmail).toHaveBeenCalledWith(user.email);
	});

	it('rejects an unknown account', async () => {
		usersService.findOneByEmail.mockResolvedValue(null);

		await expect(service.validateUser('unknown@example.com', 'password')).rejects.toThrow(
			new UnauthorizedException('Invalid credentials.'),
		);
	});

	it('rejects an incorrect password', async () => {
		const user = createUser({ password: await bcrypt.hash('correct-password', 10) });
		usersService.findOneByEmail.mockResolvedValue(user);

		await expect(service.validateUser(user.email, 'incorrect-password')).rejects.toThrow(
			new UnauthorizedException('Invalid credentials.'),
		);
	});

	it.each([
		['blocked', { isBlocked: true }],
		['inactive', { isActive: false }],
	])('rejects a %s account', async (_state, accountState) => {
		const user = createUser(accountState);
		usersService.findOneByEmail.mockResolvedValue(user);

		await expect(service.validateUser(user.email, 'password')).rejects.toThrow(
			new UnauthorizedException('Invalid credentials.'),
		);
	});

	it('signs a token using the user id and email payload', async () => {
		const password = 'correct-password';
		const user = createUser({ password: await bcrypt.hash(password, 10) });
		usersService.findOneByEmail.mockResolvedValue(user);
		jwtService.signAsync.mockResolvedValue('signed-token');

		await expect(service.signIn(user.email, password)).resolves.toEqual({
			access_token: 'signed-token',
		});
		expect(jwtService.signAsync).toHaveBeenCalledWith({
			sub: user.id,
			email: user.email,
		});
	});
});
