import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiResourceService, ResourceList } from '../platform/api-resource.service';
import { ContractAccessGuard } from '../platform/contract-access.guard';
import { UsersService } from '../users/users.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';

type Payload = Record<string, unknown>;
type RequestUser = { user: { sub: number } };

@Controller('me')
@UseGuards(ContractAccessGuard)
export class ProfileController {
	constructor(
		private readonly users: UsersService,
		private readonly resources: ApiResourceService,
	) {}

	@Get()
	async profile(@Req() request: RequestUser): Promise<Payload> {
		return { data: await this.users.findOne(request.user.sub) };
	}

	@Patch()
	async updateProfile(@Req() request: RequestUser, @Body() body: Payload): Promise<Payload> {
		return { data: await this.users.update(request.user.sub, this.userUpdate(body)) };
	}

	@Put('avatar')
	async setAvatar(@Req() request: RequestUser, @Body() body: Payload): Promise<Payload> {
		return { data: await this.users.update(request.user.sub, { avatar: String(body.media_id ?? '') }) };
	}

	@Delete('avatar')
	async removeAvatar(@Req() request: RequestUser): Promise<Payload> {
		return { data: await this.users.update(request.user.sub, { avatar: '' }) };
	}

	@Patch('contact')
	async updateContact(@Req() request: RequestUser, @Body() body: Payload): Promise<Payload> {
		return { data: await this.users.update(request.user.sub, this.userUpdate(body)) };
	}

	@Get('preferences')
	async preferences(@Req() request: RequestUser): Promise<Payload> {
		return this.singleton('me-preferences', request);
	}

	@Patch('preferences')
	async updatePreferences(@Req() request: RequestUser, @Body() body: Payload): Promise<Payload> {
		return this.upsertSingleton('me-preferences', request, body);
	}

	@Get('notification-settings')
	async notificationSettings(@Req() request: RequestUser): Promise<Payload> {
		return this.singleton('me-notification-settings', request);
	}

	@Patch('notification-settings')
	async updateNotificationSettings(@Req() request: RequestUser, @Body() body: Payload): Promise<Payload> {
		return this.upsertSingleton('me-notification-settings', request, body);
	}

	@Get('devices')
	async devices(@Req() request: RequestUser): Promise<Payload> {
		return this.collection('me-devices', request);
	}

	@Post('devices')
	async registerDevice(@Req() request: RequestUser, @Body() body: Payload): Promise<Payload> {
		return { data: await this.resources.create('me-devices', body, this.owner(request)) };
	}

	@Delete('devices/:id')
	async removeDevice(@Param('id') id: string): Promise<Payload> {
		await this.resources.remove('me-devices', id);
		return { data: { id, deleted: true } };
	}

	@Get('favorites')
	async favorites(@Req() request: RequestUser): Promise<Payload> {
		return this.collection('me-favorites', request);
	}

	@Put('favorites/:contentType/:contentId')
	async favorite(
		@Param('contentType') contentType: string,
		@Param('contentId') contentId: string,
		@Req() request: RequestUser,
	): Promise<Payload> {
		return {
			data: await this.resources.create(
				'me-favorites',
				{ content_type: contentType, content_id: contentId },
				this.owner(request),
			),
		};
	}

	@Delete('favorites/:contentType/:contentId')
	async unfavorite(@Param('contentId') contentId: string): Promise<Payload> {
		await this.resources.remove('me-favorites', contentId);
		return { data: { content_id: contentId, deleted: true } };
	}

	@Get('history')
	async history(@Req() request: RequestUser): Promise<Payload> {
		return this.collection('me-progress', request);
	}

	@Put('progress/:contentType/:contentId')
	async saveProgress(
		@Param('contentType') contentType: string,
		@Param('contentId') contentId: string,
		@Req() request: RequestUser,
		@Body() body: Payload,
	): Promise<Payload> {
		return {
			data: await this.resources.create(
				'me-progress',
				{ ...body, content_type: contentType, content_id: contentId },
				this.owner(request),
			),
		};
	}

	@Get('giving')
	async giving(@Req() request: RequestUser): Promise<Payload> {
		return this.collection('giving-intents', request);
	}

	@Get('prayer-requests')
	async prayerRequests(@Req() request: RequestUser): Promise<Payload> {
		return this.collection('prayer-requests', request);
	}

	@Get('events')
	async myEvents(@Req() request: RequestUser): Promise<Payload> {
		return this.collection('events-rsvp', request);
	}

	@Post('data-export')
	async requestExport(@Req() request: RequestUser): Promise<Payload> {
		return { data: await this.resources.create('data-exports', {}, this.owner(request), 'pending') };
	}

	@Delete()
	async deleteAccount(@Req() request: RequestUser): Promise<Payload> {
		return { data: await this.users.update(request.user.sub, { isActive: false }) };
	}

	@Post('restore')
	async restoreAccount(@Req() request: RequestUser): Promise<Payload> {
		return { data: await this.users.update(request.user.sub, { isActive: true }) };
	}

	@Get('security-log')
	async securityLog(@Req() request: RequestUser): Promise<Payload> {
		return this.collection('audit-auth', request);
	}

	@Get('consents')
	async consents(@Req() request: RequestUser): Promise<Payload> {
		return this.collection('consents', request);
	}

	@Post('consents')
	async recordConsent(@Req() request: RequestUser, @Body() body: Payload): Promise<Payload> {
		return { data: await this.resources.create('consents', body, this.owner(request)) };
	}

	private async singleton(resourceType: string, request: RequestUser): Promise<Payload> {
		const records = await this.resources.listOwned(resourceType, this.owner(request), 1);
		return { data: records.data[0] ?? {} };
	}

	private async upsertSingleton(resourceType: string, request: RequestUser, body: Payload): Promise<Payload> {
		const records = await this.resources.listOwned(resourceType, this.owner(request), 1);
		if (records.data[0]) {
			return { data: await this.resources.update(resourceType, String(records.data[0].id), body) };
		}
		return { data: await this.resources.create(resourceType, body, this.owner(request)) };
	}

	private async collection(resourceType: string, request: RequestUser): Promise<Payload> {
		return this.listResponse(await this.resources.listOwned(resourceType, this.owner(request), 100));
	}

	private listResponse(page: ResourceList): Payload {
		return { data: page.data, meta: { next_cursor: page.nextCursor, has_more: page.hasMore } };
	}

	private owner(request: RequestUser): string {
		return String(request.user.sub);
	}

	private userUpdate(body: Payload): UpdateUserDto {
		const update = new UpdateUserDto();
		const stringFields: Array<
			'firstName' | 'lastName' | 'email' | 'phone' | 'gender' | 'country' | 'password' | 'avatar'
		> = ['firstName', 'lastName', 'email', 'phone', 'gender', 'country', 'password', 'avatar'];
		for (const field of stringFields) {
			if (typeof body[field] === 'string') {
				update[field] = body[field];
			}
		}
		if (typeof body.isActive === 'boolean') {
			update.isActive = body.isActive;
		}
		return update;
	}
}
