import {
	Body,
	Controller,
	Delete,
	Get,
	NotImplementedException,
	Param,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { ApiResourceService, ResourceList } from '../platform/api-resource.service';
import { ContractAccessGuard } from '../platform/contract-access.guard';

type Payload = Record<string, unknown>;
type RequestUser = { user?: { sub: number } };

@Controller()
@UseGuards(ContractAccessGuard)
export class ContentController {
	constructor(private readonly resources: ApiResourceService) {}

	@Get('devotionals/today')
	async devotionalToday(@Query('audience') audience?: string): Promise<Payload> {
		const devotionals = await this.resources.list('devotionals', 100);
		const today = new Date().toISOString().slice(0, 10);
		return {
			data:
				devotionals.data.find((item) => item.date === today && (!audience || item.audience === audience)) ??
				null,
		};
	}

	@Get('devotionals/sync')
	async devotionalSync(@Query('since') since?: string): Promise<Payload> {
		const devotionals = await this.resources.list('devotionals', 100);
		const changed = since ? devotionals.data.filter((item) => String(item.updated_at) > since) : devotionals.data;
		return { data: { changed, deleted_ids: [] } };
	}

	@Get('devotionals/by-date/:date')
	async devotionalByDate(@Param('date') date: string): Promise<Payload> {
		const devotionals = await this.resources.list('devotionals', 100);
		return { data: devotionals.data.find((item) => item.date === date) ?? null };
	}

	@Get('devotionals/:id')
	async devotional(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('devotionals', id) };
	}

	@Get('devotionals')
	async devotionals(@Query('limit') limit?: string, @Query('cursor') cursor?: string): Promise<Payload> {
		return this.collection('devotionals', limit, cursor);
	}

	@Post('devotionals/:id/share')
	async shareDevotional(@Param('id') id: string, @Body() body: Payload): Promise<Payload> {
		return { data: await this.action('devotionals', id, 'share', body) };
	}

	@Get('sermons/featured')
	async featuredSermons(): Promise<Payload> {
		const sermons = await this.resources.list('sermons', 100);
		return { data: sermons.data.filter((item) => item.featured === true) };
	}

	@Get('sermons/series')
	async sermonSeries(): Promise<Payload> {
		return this.collection('sermon-series');
	}

	@Get('sermons/series/:id')
	async sermonSeriesDetail(@Param('id') id: string): Promise<Payload> {
		const [series, sermons] = await Promise.all([
			this.resources.get('sermon-series', id),
			this.resources.list('sermons', 100),
		]);
		return { data: { ...series, sermons: sermons.data.filter((item) => item.series_id === id) } };
	}

	@Get('sermons/:id/download')
	async sermonDownload(): Promise<Payload> {
		throw new NotImplementedException('A media delivery provider adapter is required for signed download URLs.');
	}

	@Post('sermons/:id/play-events')
	async sermonPlayEvent(
		@Param('id') id: string,
		@Body() body: Payload,
		@Req() request: RequestUser,
	): Promise<Payload> {
		return { data: await this.action('sermons', id, 'play-event', body, request.user?.sub) };
	}

	@Get('sermons/:id')
	async sermon(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('sermons', id) };
	}

	@Get('sermons')
	async sermons(@Query('limit') limit?: string, @Query('cursor') cursor?: string): Promise<Payload> {
		return this.collection('sermons', limit, cursor);
	}

	@Get('speakers')
	async speakers(@Query('limit') limit?: string, @Query('cursor') cursor?: string): Promise<Payload> {
		return this.collection('speakers', limit, cursor);
	}

	@Get('live/status')
	async liveStatus(): Promise<Payload> {
		const channels = await this.resources.list('live-channels', 100);
		return { data: channels.data.filter((channel) => channel.status === 'live') };
	}

	@Get('live/channels')
	async liveChannels(): Promise<Payload> {
		return this.collection('live-channels');
	}

	@Get('live/schedule/:id')
	async liveScheduleItem(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('live-schedule', id) };
	}

	@Get('live/schedule')
	async liveSchedule(): Promise<Payload> {
		return this.collection('live-schedule');
	}

	@Post('live/reminders')
	async setLiveReminder(@Body() body: Payload, @Req() request: RequestUser): Promise<Payload> {
		return { data: await this.resources.create('live-reminders', body, this.owner(request)) };
	}

	@Delete('live/reminders/:id')
	async removeLiveReminder(@Param('id') id: string): Promise<Payload> {
		await this.resources.remove('live-reminders', id);
		return { data: { id, deleted: true } };
	}

	@Get('live/chat/token')
	async liveChatToken(): Promise<Payload> {
		throw new NotImplementedException('A live-chat provider adapter is required for chat tokens.');
	}

	@Get('events/:id')
	async event(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('events', id) };
	}

	@Get('events')
	async events(@Query('limit') limit?: string, @Query('cursor') cursor?: string): Promise<Payload> {
		return this.collection('events', limit, cursor);
	}

	@Post('events/:id/rsvp')
	async rsvp(@Param('id') id: string, @Body() body: Payload, @Req() request: RequestUser): Promise<Payload> {
		return { data: await this.action('events', id, 'rsvp', body, request.user?.sub) };
	}

	@Delete('events/:id/rsvp')
	async cancelRsvp(@Param('id') id: string): Promise<Payload> {
		return { data: { event_id: id, status: 'cancelled' } };
	}

	@Post('prayer-requests')
	async createPrayerRequest(@Body() body: Payload, @Req() request: RequestUser): Promise<Payload> {
		return { data: await this.resources.create('prayer-requests', body, this.owner(request)) };
	}

	@Get('prayer-wall')
	async prayerWall(): Promise<Payload> {
		const prayers = await this.resources.list('prayer-requests', 100);
		return { data: prayers.data.filter((prayer) => prayer.visibility === 'public') };
	}

	@Post('prayer-wall/:id/pray')
	async pray(@Param('id') id: string, @Req() request: RequestUser): Promise<Payload> {
		return { data: await this.action('prayer-requests', id, 'pray', {}, request.user?.sub) };
	}

	@Get('prayer-requests/:id')
	async prayerRequest(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('prayer-requests', id) };
	}

	@Post('prayer-requests/:id/responses')
	async prayerResponse(
		@Param('id') id: string,
		@Body() body: Payload,
		@Req() request: RequestUser,
	): Promise<Payload> {
		return { data: await this.action('prayer-requests', id, 'response', body, request.user?.sub) };
	}

	@Patch('prayer-requests/:id')
	async updatePrayerRequest(@Param('id') id: string, @Body() body: Payload): Promise<Payload> {
		return { data: await this.resources.update('prayer-requests', id, body) };
	}

	@Delete('prayer-requests/:id')
	async withdrawPrayerRequest(@Param('id') id: string): Promise<Payload> {
		await this.resources.remove('prayer-requests', id);
		return { data: { id, deleted: true } };
	}

	@Post('new-believers')
	async newBeliever(@Body() body: Payload, @Req() request: RequestUser): Promise<Payload> {
		return { data: await this.resources.create('new-believers', body, this.owner(request)) };
	}

	@Get('new-believers/:id')
	async newBelieverDetail(@Param('id') id: string): Promise<Payload> {
		return { data: await this.resources.get('new-believers', id) };
	}

	@Get('groups')
	async groups(): Promise<Payload> {
		return this.collection('groups');
	}

	@Post('groups/:id/join')
	async joinGroup(@Param('id') id: string, @Req() request: RequestUser): Promise<Payload> {
		return { data: await this.action('groups', id, 'join', {}, request.user?.sub) };
	}

	@Get('groups/:id/posts')
	async groupPosts(@Param('id') id: string): Promise<Payload> {
		const posts = await this.resources.list('group-posts', 100);
		return { data: posts.data.filter((post) => post.group_id === id) };
	}

	@Post('groups/:id/posts')
	async createGroupPost(
		@Param('id') id: string,
		@Body() body: Payload,
		@Req() request: RequestUser,
	): Promise<Payload> {
		return { data: await this.resources.create('group-posts', { ...body, group_id: id }, this.owner(request)) };
	}

	@Post('reports')
	async report(@Body() body: Payload, @Req() request: RequestUser): Promise<Payload> {
		return { data: await this.resources.create('reports', body, this.owner(request)) };
	}

	@Get('home')
	async home(): Promise<Payload> {
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

	@Get('announcements')
	async announcements(): Promise<Payload> {
		return this.collection('announcements');
	}

	@Get('pages/:slug')
	async page(@Param('slug') slug: string): Promise<Payload> {
		const pages = await this.resources.list('pages', 100);
		return { data: pages.data.find((page) => page.slug === slug) ?? null };
	}

	@Get('contact-info')
	async contactInfo(): Promise<Payload> {
		const settings = await this.resources.list('contact-info', 1);
		return { data: settings.data[0] ?? {} };
	}

	@Post('contact-messages')
	async contactMessage(@Body() body: Payload): Promise<Payload> {
		return { data: await this.resources.create('contact-messages', body, null) };
	}

	@Post('partner-inquiries')
	async partnerInquiry(@Body() body: Payload): Promise<Payload> {
		return { data: await this.resources.create('partner-inquiries', body, null) };
	}

	@Post('feedback')
	async feedback(@Body() body: Payload): Promise<Payload> {
		return { data: await this.resources.create('feedback', body, null) };
	}

	private async collection(resourceType: string, limit?: string, cursor?: string): Promise<Payload> {
		const page = await this.resources.list(resourceType, this.limit(limit), cursor);
		return this.listResponse(page);
	}

	private async action(
		resourceType: string,
		targetId: string,
		action: string,
		body: Payload,
		userId?: number,
	): Promise<Payload> {
		return this.resources.create(
			`${resourceType}-${action}`,
			{ ...body, target_id: targetId },
			userId ? String(userId) : null,
		);
	}

	private listResponse(page: ResourceList): Payload {
		return { data: page.data, meta: { next_cursor: page.nextCursor, has_more: page.hasMore } };
	}

	private owner(request: RequestUser): string | null {
		return request.user ? String(request.user.sub) : null;
	}

	private limit(value?: string): number {
		const parsed = Number(value ?? 20);
		return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), 100) : 20;
	}
}
