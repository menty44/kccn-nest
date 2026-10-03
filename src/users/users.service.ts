import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
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

	async create(createUserDto: CreateUserDto): Promise<any> {
		if (await this.findOneByEmail(createUserDto.email)) {
			return { error: 'Email already exists' };
		}
		if (await this.findOneByPhone(createUserDto.phone)) {
			return { error: 'Phone already exists' };
		}
		const user = this.usersRepository.create({
			...createUserDto,
			password: await bcrypt.hash(createUserDto.password, 10),
		} as unknown as User);

		return this.usersRepository.save(user);
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
