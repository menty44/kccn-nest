import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiResourceService } from './api-resource.service';
import { ApiResource } from './entities/api-resource.entity';
import { ContractController } from './contract.controller';
import { ContractAccessGuard } from './contract-access.guard';

@Module({
	imports: [TypeOrmModule.forFeature([ApiResource])],
	controllers: [ContractController],
	providers: [ApiResourceService, ContractAccessGuard],
	exports: [ApiResourceService, ContractAccessGuard],
})
export class PlatformModule {}
