import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CommonutilsService } from '../commonutils/commonutils.service';
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
	private readonly logger = new Logger(UsersService.name);

	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		@InjectRepository(Otp)
		private otpRepository: Repository<Otp>,
		private common: CommonutilsService,
	) {}

	async findAll(): Promise<Array<Omit<User, 'password'>>> {
		return (await this.usersRepository.find()).map((user) => this.excludePassword(user));
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

	async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
		try {
			const { user, otpCode } = await this.usersRepository.manager.transaction(async (manager) => {
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

				const otpCode = randomInt(100_000, 1_000_000).toString();
				await otpRepository.save(
					otpRepository.create({
						userid: user.id,
						code: otpCode,
					} as Otp),
				);

				return { user: this.excludePassword(user), otpCode };
			});
			this.queueOtpDelivery(user.id, createUserDto.email, otpCode);
			return user;
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

	async requestVerificationOtp(email?: string, userid?: number): Promise<{ status: 'sent' }> {
		const user =
			email !== undefined
				? await this.usersRepository.findOneBy({ email })
				: await this.usersRepository.findOneBy({ id: userid });
		if (!user) {
			return { status: 'sent' };
		}

		this.common.assertOtpDeliveryConfigured();
		const code = randomInt(100_000, 1_000_000).toString();
		await this.otpRepository.delete({ userid: user.id });
		await this.otpRepository.save(this.otpRepository.create({ userid: user.id, code }));
		await this.common.sendOtp(user.email, code);
		return { status: 'sent' };
	}

	private queueOtpDelivery(userId: number, email: string, code: string): void {
		void this.common.sendOtp(email, code).catch((error: unknown) => {
			const message = error instanceof Error ? error.message : 'Unknown email delivery error';
			const stack = error instanceof Error ? error.stack : undefined;
			this.logger.error(`Unable to send verification OTP for user ${userId}: ${message}`, stack);
		});
	}

	private excludePassword(user: User): Omit<User, 'password'> {
		const safeUser = { ...user };
		delete safeUser.password;
		return safeUser;
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

	async resetPassword(email: string): Promise<any> {
		const user = await this.usersRepository.findOneBy({ email });
		if (!user) {
			throw new NotFoundException({
				code: 'USER_NOT_FOUND',
				message: 'No account found with this email.',
			});
		}
		this.common.resetPassword(randomInt(100_000, 1_000_000).toString(), email);
		// const newPassword = randomInt(100_000, 1_000_000).toString();
		// user.password = await bcrypt.hash(newPassword, 10);

		// await this.usersRepository.save(user);

		return { message: 'Password reset successful.' };
	}
}
