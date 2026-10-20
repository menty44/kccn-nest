import { All, Body, Controller, Headers, NotImplementedException, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiResourceService } from './api-resource.service';
import { ContractAccessGuard } from './contract-access.guard';

interface AuthenticatedRequest extends Request {
	user?: { sub: number; email: string; roles?: string[] };
}

@Controller()
@UseGuards(ContractAccessGuard)
export class ContractController {
	constructor(private readonly resources: ApiResourceService) {}

	@All('*')
	async dispatch(
		@Req() request: AuthenticatedRequest,
		@Body() body: Record<string, unknown>,
		@Param() _params: Record<string, string>,
		@Query('limit') limitValue?: string,
		@Query('cursor') cursor?: string,
		@Headers('idempotency-key') idempotencyKey?: string,
	): Promise<Record<string, unknown>> {
		const path = request.path.replace(/^\/v1\/?/, '').replace(/^\/|\/$/g, '');
		const segments = path ? path.split('/') : [];
		const resourceType = this.resourceType(segments);
		const id = segments.find((segment) => this.isUuid(segment));
		const action = id ? segments[segments.indexOf(id) + 1] : undefined;

		if (this.requiresExternalProvider(segments)) {
			throw new NotImplementedException(
				'This operation requires a configured provider adapter. Configure the corresponding interface implementation first.',
			);
		}

		switch (request.method) {
			case 'GET':
				if (path === 'home') {
					return this.home();
				}
				if (id) {
					return { data: await this.resources.get(resourceType, id) };
				}
				return this.list(resourceType, limitValue, cursor);
			case 'POST':
				if (id && action) {
					return this.createAction(resourceType, id, action, body, request.user?.sub, idempotencyKey);
				}
				return {
					data: await this.resources.create(
						resourceType,
						{ ...body, ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}) },
						request.user ? String(request.user.sub) : null,
						this.initialStatus(segments),
					),
				};
			case 'PATCH':
			case 'PUT':
				if (!id) {
					throw new NotImplementedException('Collection-wide updates are not supported.');
				}
				return { data: await this.resources.update(resourceType, id, body) };
			case 'DELETE':
				if (!id) {
					throw new NotImplementedException('Collection-wide deletes are not supported.');
				}
				await this.resources.remove(resourceType, id);
				return { data: { id, deleted: true } };
			default:
				throw new NotImplementedException('The requested HTTP method is not supported.');
		}
	}

	private async list(resourceType: string, limitValue?: string, cursor?: string): Promise<Record<string, unknown>> {
		const parsedLimit = Number(limitValue ?? 20);
		const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(Math.floor(parsedLimit), 1), 100) : 20;
		const result = await this.resources.list(resourceType, limit, cursor);
		return {
			data: result.data,
			meta: {
				next_cursor: result.nextCursor,
				has_more: result.hasMore,
			},
		};
	}

	private async createAction(
		resourceType: string,
		id: string,
		action: string,
		body: Record<string, unknown>,
		ownerId?: number,
		idempotencyKey?: string,
	): Promise<Record<string, unknown>> {
		if (['publish', 'unpublish', 'suspend', 'reactivate', 'cancel', 'resolve', 'read'].includes(action)) {
			const status =
				{
					publish: 'published',
					unpublish: 'draft',
					suspend: 'suspended',
					reactivate: 'active',
					cancel: 'cancelled',
					resolve: 'resolved',
					read: 'read',
				}[action] ?? 'active';
			return { data: await this.resources.update(resourceType, id, body, status) };
		}

		const interaction = await this.resources.create(
			`${resourceType}-${action}`,
			{ ...body, target_id: id, ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}) },
			ownerId ? String(ownerId) : null,
		);
		return { data: interaction };
	}

	private resourceType(segments: string[]): string {
		const meaningful = segments.filter((segment) => !this.isUuid(segment));
		if (meaningful[0] === 'admin') {
			const resource = meaningful[1];
			if (['devotionals', 'sermons', 'events', 'announcements', 'speakers', 'sermon-series'].includes(resource)) {
				return resource;
			}
			if (['live', 'giving', 'analytics'].includes(resource) && meaningful[2]) {
				return `${resource}-${meaningful[2]}`;
			}
			return resource ?? 'admin';
		}
		if (meaningful[0] === 'me') {
			return meaningful.slice(0, 2).join('-');
		}
		return meaningful.slice(0, 2).join('-') || 'root';
	}

	private initialStatus(segments: string[]): string {
		return segments[0] === 'admin' && ['devotionals', 'sermons', 'events'].includes(segments[1])
			? 'draft'
			: 'active';
	}

	private isUuid(value: string): boolean {
		return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
	}

	private requiresExternalProvider(segments: string[]): boolean {
		const path = segments.join('/');
		return (
			path === 'media/uploads/sign' ||
			path === 'media/uploads/confirm' ||
			path.startsWith('webhooks/') ||
			path.startsWith('giving/intents') ||
			path.startsWith('giving/recurring') ||
			path.startsWith('auth/')
		);
	}

	private async home(): Promise<Record<string, unknown>> {
		const [devotionals, sermons, events, announcements] = await Promise.all([
			this.resources.list('devotionals', 1),
			this.resources.list('sermons', 10),
			this.resources.list('events', 10),
			this.resources.list('announcements', 10),
		]);
		return {
			data: {
				todays_devotional: devotionals.data[0] ?? null,
				featured_sermons: sermons.data,
				upcoming_events: events.data,
				announcements: announcements.data,
			},
		};
	}
}
