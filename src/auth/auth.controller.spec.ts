jest.mock(
	'./jwt-auth.guard.js',
	() => ({
		JwtAuthGuard: class JwtAuthGuard {},
	}),
	{ virtual: true },
);

jest.mock(
	'./auth.service.js',
	() => ({
		AuthService: class AuthService {},
	}),
	{ virtual: true },
);

jest.mock(
	'../users/users.service.js',
	() => ({
		UsersService: class UsersService {},
	}),
	{ virtual: true },
);

jest.mock(
	'../users/dto/create-user.dto.js',
	() => ({
		CreateUserDto: class CreateUserDto {},
	}),
	{ virtual: true },
);

jest.mock(
	'./dto/login.dto.js',
	() => ({
		LoginDto: class LoginDto {},
	}),
	{ virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

describe('AuthController', () => {
	let controller: AuthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{ provide: AuthService, useValue: {} },
				{ provide: UsersService, useValue: {} },
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
