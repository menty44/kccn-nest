import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Otp } from '../otp/entities/otp.entity';
import { CommonutilsModule } from '../commonutils/commonutils.module';

@Module({
	imports: [TypeOrmModule.forFeature([User, Otp]), CommonutilsModule],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}
