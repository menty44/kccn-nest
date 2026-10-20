import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
	AuditLog,
	Job,
	RateLimitBucket,
	RolePermission,
	UserPermissionOverride,
	UserRole,
} from './entities/security.entity';

@Injectable()
export class SecurityService {
	constructor(
		@InjectRepository(UserRole) private readonly userRoles: Repository<UserRole>,
		@InjectRepository(RolePermission) private readonly rolePermissions: Repository<RolePermission>,
		@InjectRepository(UserPermissionOverride) private readonly overrides: Repository<UserPermissionOverride>,
		@InjectRepository(AuditLog) private readonly audits: Repository<AuditLog>,
		@InjectRepository(RateLimitBucket) private readonly limits: Repository<RateLimitBucket>,
		@InjectRepository(Job) private readonly jobs: Repository<Job>,
	) {}

	async hasPermission(userId: number, permission: string, isAdmin = false): Promise<boolean> {
		if (isAdmin) return true;
		const overrides = await this.overrides.find({ where: { userId, permissionKey: permission } });
		if (overrides.some((entry) => entry.effect === 'deny')) return false;
		if (overrides.some((entry) => entry.effect === 'grant')) return true;
		const roles = await this.userRoles.find({ where: { userId } });
		if (!roles.length) return permission === 'content:read';
		const grants = await Promise.all(
			roles.map((role) => this.rolePermissions.find({ where: { roleId: role.roleId } })),
		);
		return grants.flat().some((grant) => grant.permissionKey === permission);
	}

	async audit(input: Omit<AuditLog, 'id' | 'occurredAt' | 'hash' | 'prevHash'>): Promise<AuditLog> {
		const previous = await this.audits.find({ order: { occurredAt: 'DESC' }, take: 1 });
		const prevHash = previous[0]?.hash ?? null;
		const occurredAt = new Date();
		const hash = createHash('sha256')
			.update(JSON.stringify({ ...input, occurredAt: occurredAt.toISOString(), prevHash }))
			.digest('hex');
		return this.audits.save(this.audits.create({ ...input, occurredAt, prevHash, hash }));
	}

	async consumeRateLimit(
		key: string,
		limit: number,
		windowMs: number,
	): Promise<{ allowed: boolean; remaining: number; reset: Date }> {
		const now = new Date();
		let bucket = await this.limits.findOneBy({ key });
		if (!bucket || bucket.windowEndsAt <= now)
			bucket = this.limits.create({ key, count: 0, windowEndsAt: new Date(now.getTime() + windowMs) });
		bucket.count += 1;
		await this.limits.save(bucket);
		return {
			allowed: bucket.count <= limit,
			remaining: Math.max(0, limit - bucket.count),
			reset: bucket.windowEndsAt,
		};
	}

	async enqueue(type: string, payload: Record<string, unknown>, runAt = new Date()): Promise<Job> {
		return this.jobs.save(
			this.jobs.create({ type, payload, runAt, status: 'queued', attempts: 0, completedAt: null }),
		);
	}
}
