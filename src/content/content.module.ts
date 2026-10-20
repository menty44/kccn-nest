import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { ContentController } from './content.controller';

@Module({
	imports: [PlatformModule],
	controllers: [ContentController],
})
export class ContentModule {}
