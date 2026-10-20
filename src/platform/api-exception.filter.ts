import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
	catch(exception: unknown, host: ArgumentsHost): void {
		const response = host.switchToHttp().getResponse<Response>();
		const request = host.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
		const requestId = request.headers['x-request-id'] ?? randomUUID();
		const httpException =
			exception instanceof HttpException
				? exception
				: new HttpException('An unexpected error occurred.', HttpStatus.INTERNAL_SERVER_ERROR);
		const responseBody = httpException.getResponse() as string | { message?: string | string[] };
		const message =
			typeof responseBody === 'string'
				? responseBody
				: Array.isArray(responseBody.message)
					? responseBody.message.join(', ')
					: (responseBody.message ?? 'Request failed.');

		response.status(httpException.getStatus()).json({
			error: {
				code: this.codeFor(httpException.getStatus()),
				message,
				request_id: requestId,
			},
		});
	}

	private codeFor(status: number): string {
		const codes: Record<number, string> = {
			400: 'bad_request',
			401: 'unauthenticated',
			403: 'forbidden',
			404: 'not_found',
			409: 'conflict',
			422: 'validation_failed',
			429: 'rate_limited',
		};
		return codes[status] ?? 'internal_error';
	}
}
