import { IsEmail, IsInt, IsOptional, Min } from 'class-validator';

export class RequestOtpDto {
	@IsOptional()
	@IsEmail()
	email?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	userid?: number;
}
