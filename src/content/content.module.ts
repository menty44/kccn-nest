import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { ContentController } from './content.controller';
import { AdminSermonsController } from './admin-sermons.controller';

@Module({
	imports: [PlatformModule],
	controllers: [ContentController, AdminSermonsController],
})
export class ContentModule {}
