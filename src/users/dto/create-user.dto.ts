import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
	@IsNotEmpty()
	firstname: string;

	@IsNotEmpty()
	lastname: string;

	@IsNotEmpty()
	email: string;

	@IsNotEmpty()
	phone: string;

	@IsNotEmpty()
	gender: string;

	@IsNotEmpty()
	country: string;

	@IsNotEmpty()
	password: string;
}
