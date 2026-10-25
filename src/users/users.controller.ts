import { Controller, Get, UseGuards } from '@nestjs/common';
import { ContractAccessGuard } from '../platform/contract-access.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(ContractAccessGuard)
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	findAll() {
		return this.usersService.findAll();
	}
}
