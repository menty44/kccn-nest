import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
	let service: UsersService;
	const repository = {
		create: jest.fn(),
		save: jest.fn(),
		preload: jest.fn(),
	};

	beforeEach(async () => {
		jest.clearAllMocks();
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: getRepositoryToken(User),
					useValue: repository,
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('hashes a password before creating a user', async () => {
		const createUserDto: CreateUserDto = {
			firstname: 'Jane',
			lastname: 'Doe',
			email: 'jane@example.com',
			phone: '123456789',
			gender: 'female',
			country: 'Uganda',
			password: 'plain-password',
		};
		repository.create.mockImplementation((user) => user);
		repository.save.mockImplementation(async (user) => user);

		const user = await service.create(createUserDto);

		expect(user.password).not.toBe(createUserDto.password);
		await expect(bcrypt.compare(createUserDto.password, user.password)).resolves.toBe(true);
	});

	it('hashes a supplied password before updating a user', async () => {
		const password = 'new-plain-password';
		const updateUserDto = { password } as UpdateUserDto & Partial<CreateUserDto>;
		repository.preload.mockImplementation(async (user) => user);
		repository.save.mockImplementation(async (user) => user);

		const user = await service.update(1, updateUserDto);

		expect(user?.password).not.toBe(password);
		await expect(bcrypt.compare(password, user?.password ?? '')).resolves.toBe(true);
	});
});
