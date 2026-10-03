import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { User } from './users/entities/user.entity';
import { OtpModule } from './otp/otp.module';
import { Otp } from './otp/entities/otp.entity';
import { NotificationModule } from './notification/notification.module';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: 'localhost',
			port: 5432,
			username: 'postgres',
			password: 'password',
			database: 'kccn_backend',
			entities: [User, Otp],
			synchronize: true,
		}),
		AuthModule,
		UsersModule,
		HealthModule,
		OtpModule,
		NotificationModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {
	constructor(private dataSource: DataSource) {}
}
