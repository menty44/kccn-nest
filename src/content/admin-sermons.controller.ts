import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiResourceService } from '../platform/api-resource.service';
import { ContractAccessGuard } from '../platform/contract-access.guard';

type Payload = Record<string, unknown>;

@Controller('admin')
@UseGuards(ContractAccessGuard)
export class AdminSermonsController {
	constructor(private readonly resources: ApiResourceService) {}

	@Post('sermons')
	createSermon(@Body() body: Payload): Promise<Payload> {
		return this.create('sermons', body, 'draft');
	}

	@Patch('sermons/:id')
	async updateSermon(@Param('id') id: string, @Body() body: Payload): Promise<Payload> {
		return { data: await this.resources.update('sermons', id, body) };
	}

	@Post('sermons/:id/publish')
	async publishSermon(@Param('id') id: string, @Body() body: Payload): Promise<Payload> {
		return {
			data: await this.resources.update(
				'sermons',
				id,
				{ ...body, published_at: body.publish_at ?? new Date().toISOString() },
				'published',
			),
		};
	}

	@Delete('sermons/:id')
	async deleteSermon(@Param('id') id: string): Promise<Payload> {
		await this.resources.remove('sermons', id);
		return { data: { id, deleted: true } };
	}

	@Post('sermon-series')
	createSeries(@Body() body: Payload): Promise<Payload> {
		return this.create('sermon-series', body);
	}

	@Patch('sermon-series/:id')
	async updateSeries(@Param('id') id: string, @Body() body: Payload): Promise<Payload> {
		return { data: await this.resources.update('sermon-series', id, body) };
	}

	@Post('speakers')
	createSpeaker(@Body() body: Payload): Promise<Payload> {
		return this.create('speakers', body);
	}

	private async create(resourceType: string, body: Payload, status = 'active'): Promise<Payload> {
		return { data: await this.resources.create(resourceType, body, null, status) };
	}
}
