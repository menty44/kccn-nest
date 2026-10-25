import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Otp } from '../otp/entities/otp.entity';
import { CommonutilsModule } from '../commonutils/commonutils.module';
import { PlatformModule } from '../platform/platform.module';
import { UsersController } from './users.controller';

@Module({
	imports: [TypeOrmModule.forFeature([User, Otp]), CommonutilsModule, PlatformModule],
	controllers: [UsersController],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
