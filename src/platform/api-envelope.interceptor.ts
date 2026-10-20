import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class ApiEnvelopeInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const response = context.switchToHttp().getResponse();
		const request = context.switchToHttp().getRequest();
		const requestId = request.headers['x-request-id'] ?? randomUUID();
		response.setHeader('X-Request-Id', requestId);

		return next.handle().pipe(
			map((body: unknown) => {
				if (body && typeof body === 'object' && 'data' in body) {
					return body;
				}
				return { data: body, meta: { request_id: requestId } };
			}),
		);
	}
}
