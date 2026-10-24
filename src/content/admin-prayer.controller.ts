import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiResourceService } from '../platform/api-resource.service';
import { ContractAccessGuard } from '../platform/contract-access.guard';

type Payload = Record<string, unknown>;

@Controller('admin')
@UseGuards(ContractAccessGuard)
export class AdminPrayerController {
	constructor(private readonly resources: ApiResourceService) {}

	@Get('prayer-requests')
	async prayerQueue(@Query('status') status?: string, @Query('visibility') visibility?: string): Promise<Payload> {
		const prayers = await this.resources.list('prayer-requests', 100);
		return {
			data: prayers.data.filter(
				(prayer) => (!status || prayer.status === status) && (!visibility || prayer.visibility === visibility),
			),
		};
	}

	@Post('prayer-requests/:id/assign')
	async assign(@Param('id') id: string, @Body('assigned_to') assignedTo: string): Promise<Payload> {
		return { data: await this.resources.update('prayer-requests', id, { assigned_to: assignedTo }, 'assigned') };
	}

	@Patch('prayer-requests/:id')
	async update(@Param('id') id: string, @Body() body: Payload): Promise<Payload> {
		return {
			data: await this.resources.update(
				'prayer-requests',
				id,
				body,
				typeof body.status === 'string' ? body.status : undefined,
			),
		};
	}
}
