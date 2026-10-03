import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { QueryFailedError, Repository } from 'typeorm';
import { randomInt } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Otp } from '../otp/entities/otp.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		@InjectRepository(Otp)
		private otpRepository: Repository<Otp>,
	) {}

	findAll(): Promise<User[]> {
		return this.usersRepository.find();
	}

	findOne(id: number): Promise<User | null> {
		return this.usersRepository.findOneBy({ id });
	}

	findOneByEmail(email: string): Promise<User | null> {
		return this.usersRepository.findOneBy({ email });
	}

	findOneByPhone(phone: string): Promise<User | null> {
		return this.usersRepository.findOneBy({ phone });
	}

	async create(createUserDto: CreateUserDto): Promise<User> {
		try {
			return await this.usersRepository.manager.transaction(async (manager) => {
				const usersRepository = manager.getRepository(User);
				const otpRepository = manager.getRepository(Otp);
				const [existingEmail, existingPhone] = await Promise.all([
					usersRepository.findOneBy({ email: createUserDto.email }),
					usersRepository.findOneBy({ phone: createUserDto.phone }),
				]);

				if (existingEmail) {
					throw new ConflictException({
						code: 'EMAIL_ALREADY_EXISTS',
						message: 'An account with this email already exists.',
					});
				}

				if (existingPhone) {
					throw new ConflictException({
						code: 'PHONE_ALREADY_EXISTS',
						message: 'An account with this phone number already exists.',
					});
				}

				const user = await usersRepository.save(
					usersRepository.create({
						...createUserDto,
						password: await bcrypt.hash(createUserDto.password, 10),
					} as User),
				);

				await otpRepository.save(
					otpRepository.create({
						userid: user.id,
						code: randomInt(100_000, 1_000_000).toString(),
					} as Otp),
				);

				return user;
			});
		} catch (error) {
			if (this.isUniqueConstraintViolation(error)) {
				throw new ConflictException({
					code: 'USER_ALREADY_EXISTS',
					message: 'An account with this email or phone number already exists.',
				});
			}

			throw error;
		}
	}

	private isUniqueConstraintViolation(error: unknown): error is QueryFailedError {
		return error instanceof QueryFailedError && error.driverError?.code === '23505';
	}

	async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
		const password = (updateUserDto as Partial<CreateUserDto>).password;
		const user = await this.usersRepository.preload({
			id,
			...updateUserDto,
			...(password === undefined ? {} : { password: await bcrypt.hash(password, 10) }),
		} as User);

		return user ? this.usersRepository.save(user) : null;
	}

	async remove(id: number): Promise<void> {
		await this.usersRepository.delete(id);
	}
}
