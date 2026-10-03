import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
	@IsString()
	@IsNotEmpty()
	firstName: string;

	@IsString()
	@IsNotEmpty()
	lastName: string;

	@IsEmail()
	email: string;

	@IsString()
	@IsNotEmpty()
	phone: string;

	@IsString()
	@IsNotEmpty()
	gender: string;

	@IsString()
	@IsNotEmpty()
	country: string;

	@IsString()
	@MinLength(8)
	password: string;
}
