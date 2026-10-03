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

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
	let controller: AuthController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [{ provide: AuthService, useValue: {} }],
		}).compile();

		controller = module.get<AuthController>(AuthController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
