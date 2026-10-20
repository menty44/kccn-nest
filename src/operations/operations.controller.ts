import {
	All,
	Body,
	Controller,
	Delete,
	Get,
	NotImplementedException,
	Param,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiResourceService, ResourceList } from '../platform/api-resource.service';
import { ContractAccessGuard } from '../platform/contract-access.guard';

type Payload = Record<string, unknown>;
type RequestUser = { user?: { sub: number } };

@Controller()
@UseGuards(ContractAccessGuard)
export class OperationsController {
	constructor(private readonly resources: ApiResourceService) {}

	@Get('giving/funds')
	async givingFunds(): Promise<Payload> {
		return this.collection('giving-funds');
	}

	@Get('giving/methods')
	async givingMethods(): Promise<Payload> {
		const methods = await this.resources.list('giving-methods', 100);
		return { data: methods.data };
	}

	@Post('giving/intents')
	async createGivingIntent(): Promise<Payload> {
		throw new NotImplementedException('A payment provider adapter is required to create giving intents.');
	}

	@Get('giving/intents/:id')
	async givingIntent(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('giving-intents', id) };
	}

	@Get('giving/receipts/:id')
	async givingReceipt(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('giving-receipts', id) };
	}

	@Post('giving/recurring')
	async recurringGiving(): Promise<Payload> {
		throw new NotImplementedException('A payment provider adapter is required to create recurring gifts.');
	}

	@Post('media/uploads/sign')
	async signUpload(): Promise<Payload> {
		throw new NotImplementedException('A Cloudinary provider adapter is required to sign uploads.');
	}

	@Post('media/uploads/confirm')
	async confirmUpload(): Promise<Payload> {
		throw new NotImplementedException('A Cloudinary provider adapter is required to confirm uploads.');
	}

	@Get('media/:id/usage')
	async mediaUsage(@Param('id') id: string): Promise<Payload> {
		const usage = await this.resources.list('media-usage', 100);
		return { data: usage.data.filter((item) => item.media_id === id) };
	}

	@Get('media/:id')
	async media(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('media', id) };
	}

	@Get('media')
	async mediaLibrary(): Promise<Payload> {
		return this.collection('media');
	}

	@Post('media/:id/purge')
	async purgeMedia(): Promise<Payload> {
		throw new NotImplementedException('A Cloudinary provider adapter is required to purge media.');
	}

	@Post('media/:id/regenerate')
	async regenerateMedia(): Promise<Payload> {
		throw new NotImplementedException('A Cloudinary provider adapter is required to regenerate transformations.');
	}

	@Get('notifications')
	async notifications(@Req() request: RequestUser): Promise<Payload> {
		return this.collection('notifications', request);
	}

	@Post('notifications/:id/read')
	async markRead(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.update('notifications', id, {}, 'read') };
	}

	@Post('notifications/read-all')
	async markAllRead(@Req() request: RequestUser): Promise<Payload> {
		const notifications = await this.resources.listOwned('notifications', this.owner(request), 100);
		await Promise.all(
			notifications.data.map((item) => this.resources.update('notifications', String(item.id), {}, 'read')),
		);
		return { data: { updated: notifications.data.length } };
	}

	@Get('notifications/unread-count')
	async unreadCount(@Req() request: RequestUser): Promise<Payload> {
		const notifications = await this.resources.listOwned('notifications', this.owner(request), 100);
		return { data: { count: notifications.data.filter((item) => item.status !== 'read').length } };
	}

	@Post('notifications/topics/:topic/subscribe')
	async subscribe(@Param('topic') topic: string, @Req() request: RequestUser): Promise<Payload> {
		return { data: await this.resources.create('notification-subscriptions', { topic }, this.owner(request)) };
	}

	@Delete('notifications/topics/:topic/subscribe')
	async unsubscribe(@Param('topic') topic: string): Promise<Payload> {
		return { data: { topic, subscribed: false } };
	}

	@Get('search/suggestions')
	async searchSuggestions(): Promise<Payload> {
		return this.collection('search-suggestions');
	}

	@Get('search')
	async search(): Promise<Payload> {
		const [devotionals, sermons, events] = await Promise.all([
			this.resources.list('devotionals', 100),
			this.resources.list('sermons', 100),
			this.resources.list('events', 100),
		]);
		return { data: [...devotionals.data, ...sermons.data, ...events.data] };
	}

	@Get('config')
	async config(): Promise<Payload> {
		const configs = await this.resources.list('config', 1);
		return {
			data: configs.data[0] ?? {
				supported_languages: ['en', 'lg', 'rn'],
				maintenance: false,
			},
		};
	}

	@Get('version')
	version(): Payload {
		return { data: { api_version: 'v1', build: process.env.BUILD_SHA ?? 'development' } };
	}

	@Get('legal/:document')
	async legal(@Param('document') document: string): Promise<Payload> {
		const legal = await this.resources.list('legal-pages', 100);
		return { data: legal.data.find((item) => item.slug === document) ?? null };
	}

	@Post('support/tickets')
	async supportTicket(@Body() body: Payload, @Req() request: RequestUser): Promise<Payload> {
		return { data: await this.resources.create('support-tickets', body, this.owner(request)) };
	}

	@Get('support/tickets/:id')
	async supportTicketDetail(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('support-tickets', id) };
	}

	private async collection(resourceType: string, request?: RequestUser): Promise<Payload> {
		const page = request?.user
			? await this.resources.listOwned(resourceType, this.owner(request), 100)
			: await this.resources.list(resourceType, 100);
		return this.listResponse(page);
	}

	private listResponse(page: ResourceList): Payload {
		return { data: page.data, meta: { next_cursor: page.nextCursor, has_more: page.hasMore } };
	}

	private owner(request: RequestUser): string {
		if (!request.user) {
			throw new NotImplementedException('Authentication is required.');
		}
		return String(request.user.sub);
	}
}

@Controller('admin')
@UseGuards(ContractAccessGuard)
export class AdminController {
	constructor(private readonly resources: ApiResourceService) {}

	@All('*')
	async dispatch(@Req() request: RequestUser, @Body() body: Payload): Promise<Payload> {
		const path = request['path'].replace(/^\/v1\/admin\/?/, '').replace(/^\/|\/$/g, '');
		const segments = path.split('/').filter(Boolean);
		const id = segments.find((segment) => this.isUuid(segment));
		const action = id ? segments[segments.indexOf(id) + 1] : undefined;
		const resourceType = this.resourceType(segments);

		if (request['method'] === 'GET') {
			return id ? { data: await this.resources.get(resourceType, id) } : this.list(resourceType);
		}
		if (request['method'] === 'DELETE') {
			if (!id) {
				throw new NotImplementedException('A resource identifier is required.');
			}
			await this.resources.remove(resourceType, id);
			return { data: { id, deleted: true } };
		}
		if (id && ['PATCH', 'PUT'].includes(request['method'])) {
			return { data: await this.resources.update(resourceType, id, body) };
		}
		if (id && action) {
			const status = { publish: 'published', unpublish: 'draft', suspend: 'suspended', reactivate: 'active' }[
				action
			];
			return status
				? { data: await this.resources.update(resourceType, id, body, status) }
				: {
						data: await this.resources.create(
							`${resourceType}-${action}`,
							{ ...body, target_id: id },
							this.owner(request),
						),
					};
		}
		return {
			data: await this.resources.create(
				resourceType,
				body,
				this.owner(request),
				this.initialStatus(resourceType),
			),
		};
	}

	private async list(resourceType: string): Promise<Payload> {
		const page = await this.resources.list(resourceType, 100);
		return { data: page.data, meta: { next_cursor: page.nextCursor, has_more: page.hasMore } };
	}

	private resourceType(segments: string[]): string {
		if (['devotionals', 'sermons', 'events', 'announcements', 'speakers', 'sermon-series'].includes(segments[0])) {
			return segments[0];
		}
		return segments.slice(0, 2).join('-');
	}

	private initialStatus(resourceType: string): string {
		return ['devotionals', 'sermons', 'events'].includes(resourceType) ? 'draft' : 'active';
	}

	private owner(request: RequestUser): string {
		return String(request.user?.sub);
	}

	private isUuid(value: string): boolean {
		return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
	}
}
