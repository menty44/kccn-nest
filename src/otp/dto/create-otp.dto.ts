import { IsNotEmpty, IsString } from 'class-validator';

export class CreateOtpDto {
	@IsString()
	@IsNotEmpty()
	code: string;

	@IsNotEmpty()
	userid: number;
}
