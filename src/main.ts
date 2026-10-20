import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiEnvelopeInterceptor } from './platform/api-envelope.interceptor';
import { ApiExceptionFilter } from './platform/api-exception.filter';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);
	app.setGlobalPrefix('v1');
	app.useGlobalInterceptors(new ApiEnvelopeInterceptor());
	app.useGlobalFilters(new ApiExceptionFilter());
	await app.listen(3000);
}
bootstrap();
