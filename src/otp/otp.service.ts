import { Injectable } from '@nestjs/common';
import { CreateOtpDto } from './dto/create-otp.dto';
import { UpdateOtpDto } from './dto/update-otp.dto';
import { Otp } from './entities/otp.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OtpService {
	private static readonly TTL_MS = 5 * 60 * 1000;

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

	async verify(code: string, userid: number): Promise<{ status: boolean; reason?: 'invalid' | 'expired' }> {
		const otp = await this.otpRepository.findOneBy({ userid, code });
		if (!otp) {
			return { status: false, reason: 'invalid' };
		}
		if (otp.created_at.getTime() + OtpService.TTL_MS < Date.now()) {
			await this.otpRepository.delete(otp.id);
			return { status: false, reason: 'expired' };
		}

		await this.otpRepository.delete(otp.id);
		return { status: true };
	}
}
