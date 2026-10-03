import { Injectable } from '@nestjs/common';
import { CreateOtpDto } from './dto/create-otp.dto';
import { UpdateOtpDto } from './dto/update-otp.dto';
import { Otp } from './entities/otp.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OtpService {
	constructor(
		@InjectRepository(Otp)
		private otpRepository: Repository<Otp>,
	) {}

	async create(createOtpDto: CreateOtpDto) {
		const otp = this.otpRepository.create({
			...createOtpDto,
		} as unknown as Otp);

		return this.otpRepository.save(otp);
	}

	findAll() {
		return this.otpRepository.find();
	}

	findOne(id: number) {
		return `This action returns a #${id} otp`;
	}

	async update(id: number, updateOtpDto: UpdateOtpDto) {
		const otp = await this.otpRepository.preload({
			id,
			...updateOtpDto,
		} as Otp);

		return otp ? this.otpRepository.save(otp) : null;
	}

	async remove(id: number) {
		await this.otpRepository.delete(id);
	}

	verify(code: string, userid: number): Promise<Otp | null> {
		return this.otpRepository.findOneBy({ id: userid, code });
	}
}
