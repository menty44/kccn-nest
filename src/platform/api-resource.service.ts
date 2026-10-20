import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiResource } from './entities/api-resource.entity';

export interface ResourceList {
	data: Record<string, unknown>[];
	nextCursor: string | null;
	hasMore: boolean;
}

@Injectable()
export class ApiResourceService {
	constructor(
		@InjectRepository(ApiResource)
		private readonly resources: Repository<ApiResource>,
	) {}

	async create(
		resourceType: string,
		payload: Record<string, unknown>,
		ownerId: string | null,
		status = 'active',
	): Promise<Record<string, unknown>> {
		const resource = this.resources.create({
			resourceType,
			ownerId,
			status,
			data: payload,
			deletedAt: null,
		});
		return this.toResponse(await this.resources.save(resource));
	}

	async list(resourceType: string, limit: number, cursor?: string): Promise<ResourceList> {
		const resources = await this.resources.find({
			where: { resourceType, deletedAt: null },
			order: { createdAt: 'DESC' },
		});
		const start = cursor ? resources.findIndex((resource) => resource.id === cursor) + 1 : 0;
		const page = resources.slice(Math.max(start, 0), Math.max(start, 0) + limit);
		const hasMore = resources.length > Math.max(start, 0) + limit;

		return {
			data: page.map((resource) => this.toResponse(resource)),
			nextCursor: hasMore ? page[page.length - 1].id : null,
			hasMore,
		};
	}

	async get(resourceType: string, id: string): Promise<Record<string, unknown>> {
		const resource = await this.resources.findOne({ where: { id, resourceType, deletedAt: null } });
		if (!resource) {
			throw new NotFoundException('Resource not found.');
		}
		return this.toResponse(resource);
	}

	async update(
		resourceType: string,
		id: string,
		payload: Record<string, unknown>,
		status?: string,
	): Promise<Record<string, unknown>> {
		const resource = await this.resources.findOne({ where: { id, resourceType, deletedAt: null } });
		if (!resource) {
			throw new NotFoundException('Resource not found.');
		}

		resource.data = { ...resource.data, ...payload };
		if (status) {
			resource.status = status;
		}
		return this.toResponse(await this.resources.save(resource));
	}

	async remove(resourceType: string, id: string): Promise<void> {
		const resource = await this.resources.findOne({ where: { id, resourceType, deletedAt: null } });
		if (!resource) {
			throw new NotFoundException('Resource not found.');
		}
		resource.deletedAt = new Date();
		resource.status = 'deleted';
		await this.resources.save(resource);
	}

	private toResponse(resource: ApiResource): Record<string, unknown> {
		return {
			id: resource.id,
			...resource.data,
			status: resource.status,
			owner_id: resource.ownerId,
			created_at: resource.createdAt.toISOString(),
			updated_at: resource.updatedAt.toISOString(),
		};
	}
}
