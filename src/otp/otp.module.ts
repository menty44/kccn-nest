import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
// import { AuthModule } from '../auth/auth.module';

@Module({
	controllers: [OtpController],
	providers: [OtpService],
	// imports: [AuthModule],
})
export class OtpModule {}
