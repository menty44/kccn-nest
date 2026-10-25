import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { CommonutilsService } from './commonutils.service';

@Module({
	imports: [
		MailerModule.forRoot({
			transport: {
				host: process.env.SMTP_HOST,
				port: Number(process.env.SMTP_PORT ?? 587),
				secure: process.env.SMTP_SECURE === 'true',
				connectionTimeout: 5_000,
				greetingTimeout: 5_000,
				socketTimeout: 10_000,
				auth:
					process.env.SMTP_USER && process.env.SMTP_PASS
						? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
						: undefined,
			},
		}),
	],
	providers: [CommonutilsService],
	exports: [CommonutilsService],
})
export class CommonutilsModule {}
