import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { AdminController, OperationsController } from './operations.controller';

@Module({
	imports: [PlatformModule],
	controllers: [OperationsController, AdminController],
})
export class OperationsModule {}
