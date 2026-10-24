import { InternalServerErrorException, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import axios from 'axios';
import FormData from 'form-data';
import { Resend } from 'resend';

import { Liquid } from 'liquidjs';
import * as process from 'node:process';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CommonutilsService {
	constructor(@Optional() private readonly mailerService?: MailerService) {}
	async generateRandomInt() {
		return randomUUID();
	}

	async sendText(text: string) {
		const engine = new Liquid();

		engine.parseAndRender('Hello {{name | capitalize}}, welcome.', { name: text }).then((message: any) => {
			console.log(message);
			const data = new FormData();
			data.append('apiClientID', process.env.OLIVE_TREE_API_CLIENT);
			data.append('key', process.env.OLIVE_TREE_KEY);
			data.append('secret', process.env.OLIVE_TREE_SECRET);
			data.append('txtMessage', message);
			data.append('MSISDN', '0720106420');
			data.append('serviceID', process.env.OLIVE_TREE_SERVICE_ID);

			const config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: `${process.env.OLIVE_TREE_SMS_URL}/v1/send-sms`,
				headers: {
					...data.getHeaders(),
				},
				data: data,
			};

			axios
				.request(config)
				.then((response) => {
					console.log(JSON.stringify(response.data));
				})
				.catch((error) => {
					console.log(error);
				});
		});
	}

	async sendEmail(text: string) {
		if (!this.mailerService) {
			throw new InternalServerErrorException('Email delivery is not configured.');
		}

		const otp = 8383;

		await this.mailerService.sendMail({
			to: process.env.MAIL_USER,
			// from: '"Support Team" <support@example.com>', // override default from
			subject: 'Welcome to Nice App! Confirm your Email',
			template: './otp.hbs',
			context: {
				name: text,
				otp,
			},
		});
	}

	async resetPassword(code: string, email: string): Promise<void> {
		const apiKey = process.env.RESEND_API_KEY;
		if (!apiKey) {
			throw new InternalServerErrorException('Password reset email delivery is not configured.');
		}

		const { data, error } = await new Resend(apiKey).emails.send({
			from: 'onboarding@resend.dev',
			to: email,
			subject: 'Reset your password',
			html: `<p>Use the following code to reset your password:</p><p><strong>${code}</strong></p>`,
		});

		if (error) {
			console.error('Failed to send email:', error);
			throw new InternalServerErrorException('Unable to send the password reset email.');
		}

		console.log('Email sent, id:', data?.id);
	}
}
