import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { Otp } from '../otp/entities/otp.entity';

describe('UsersService', () => {
	let service: UsersService;
	const usersRepository = {
		create: jest.fn(),
		save: jest.fn(),
		preload: jest.fn(),
		findOneBy: jest.fn(),
		manager: {
			transaction: jest.fn(),
		},
	};
	const otpRepository = {
		create: jest.fn(),
		save: jest.fn(),
	};

	beforeEach(async () => {
		jest.clearAllMocks();
		usersRepository.manager.transaction.mockImplementation(async (callback) =>
			callback({
				getRepository: (entity: typeof User | typeof Otp) => (entity === User ? usersRepository : otpRepository),
			}),
		);
		usersRepository.findOneBy.mockResolvedValue(null);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: getRepositoryToken(User),
					useValue: usersRepository,
				},
				{
					provide: getRepositoryToken(Otp),
					useValue: otpRepository,
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
			firstName: 'Jane',
			lastName: 'Doe',
			email: 'jane@example.com',
			phone: '123456789',
			gender: 'female',
			country: 'Uganda',
			password: 'plain-password',
		};
		usersRepository.create.mockImplementation((user) => user);
		usersRepository.save.mockImplementation(async (user) => ({ ...user, id: 1 }));
		otpRepository.create.mockImplementation((otp) => otp);
		otpRepository.save.mockImplementation(async (otp) => otp);

		const user = await service.create(createUserDto);

		expect(user.password).not.toBe(createUserDto.password);
		await expect(bcrypt.compare(createUserDto.password, user.password)).resolves.toBe(true);
		expect(otpRepository.save).toHaveBeenCalledWith(
			expect.objectContaining({ userid: user.id, code: expect.stringMatching(/^\d{6}$/) }),
		);
		expect(usersRepository.manager.transaction).toHaveBeenCalledTimes(1);
	});

	it('returns a structured conflict when the email is already registered', async () => {
		usersRepository.findOneBy.mockResolvedValueOnce({ id: 1 });

		await expect(service.create({ email: 'jane@example.com' } as CreateUserDto)).rejects.toMatchObject(
			new ConflictException({
				code: 'EMAIL_ALREADY_EXISTS',
				message: 'An account with this email already exists.',
			}),
		);
	});

	it('hashes a supplied password before updating a user', async () => {
		const password = 'new-plain-password';
		const updateUserDto = { password } as UpdateUserDto & Partial<CreateUserDto>;
		usersRepository.preload.mockImplementation(async (user) => user);
		usersRepository.save.mockImplementation(async (user) => user);

		const user = await service.update(1, updateUserDto);

		expect(user?.password).not.toBe(password);
		await expect(bcrypt.compare(password, user?.password ?? '')).resolves.toBe(true);
	});
});
