import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AccessTokenPayload {
	sub: number;
	email: string;
	roles?: string[];
}

@Injectable()
export class ContractAccessGuard implements CanActivate {
	constructor(private readonly jwtService: JwtService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const path = request.path.replace(/^\/v1/, '');
		if (this.isPublic(path, request.method)) {
			return true;
		}

		const authorization = request.headers.authorization;
		if (!authorization?.startsWith('Bearer ')) {
			throw new UnauthorizedException('Authentication is required.');
		}

		try {
			const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(authorization.slice(7));
			request.user = payload;
			if (path.startsWith('/admin/') && !this.isStaff(payload)) {
				throw new ForbiddenException('Staff access is required.');
			}
			return true;
		} catch (error) {
			if (error instanceof ForbiddenException) {
				throw error;
			}
			throw new UnauthorizedException('The access token is invalid or expired.');
		}
	}

	private isPublic(path: string, method: string): boolean {
		if (path.startsWith('/auth/') || path.startsWith('/webhooks/')) {
			return true;
		}

		if (method === 'GET') {
			if (
				['/health', '/version', '/config', '/contact-info'].includes(path) ||
				path.startsWith('/legal/') ||
				path.startsWith('/pages/') ||
				path.startsWith('/devotionals') ||
				path.startsWith('/sermons') ||
				path.startsWith('/speakers') ||
				(path.startsWith('/live/') && path !== '/live/chat/token') ||
				path.startsWith('/events') ||
				path.startsWith('/giving/funds') ||
				path.startsWith('/giving/methods') ||
				path.startsWith('/home') ||
				path.startsWith('/search') ||
				path.startsWith('/announcements')
			) {
				return true;
			}
		}

		if (method === 'POST' && (path.startsWith('/devotionals/') || path.endsWith('/play-events'))) {
			return true;
		}

		return (
			method === 'POST' &&
			['/prayer-requests', '/new-believers', '/contact-messages', '/partner-inquiries', '/feedback'].includes(
				path,
			)
		);
	}

	private isStaff(payload: AccessTokenPayload): boolean {
		return Boolean(payload.roles?.some((role) => role !== 'member' && role !== 'guest'));
	}
}
