import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { UsersModule } from '../users/users.module';
import { ProfileController } from './profile.controller';

@Module({
	imports: [PlatformModule, UsersModule],
	controllers: [ProfileController],
})
export class ProfileModule {}
