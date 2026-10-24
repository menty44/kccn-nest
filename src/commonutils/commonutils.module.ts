import { Module } from '@nestjs/common';
import { CommonutilsService } from './commonutils.service';

@Module({
	providers: [CommonutilsService],
	exports: [CommonutilsService],
})
export class CommonutilsModule {}
