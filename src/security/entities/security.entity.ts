import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'roles' })
export class Role {
	@PrimaryGeneratedColumn('uuid')
	id: string;
	@Column({ unique: true }) key: string;
	@Column() name: string;
	@Column({ name: 'is_system', default: false }) isSystem: boolean;
}

@Entity({ name: 'permissions' })
export class Permission {
	@PrimaryColumn() key: string;
	@Column() name: string;
}

@Entity({ name: 'role_permissions' })
export class RolePermission {
	@PrimaryColumn({ name: 'role_id', type: 'uuid' }) roleId: string;
	@PrimaryColumn({ name: 'permission_key' }) permissionKey: string;
}

@Entity({ name: 'user_roles' })
export class UserRole {
	@PrimaryColumn({ name: 'user_id', type: 'integer' }) userId: number;
	@PrimaryColumn({ name: 'role_id', type: 'uuid' }) roleId: string;
}

@Entity({ name: 'user_permission_overrides' })
export class UserPermissionOverride {
	@PrimaryColumn({ name: 'user_id', type: 'integer' }) userId: number;
	@PrimaryColumn({ name: 'permission_key' }) permissionKey: string;
	@Column() effect: 'grant' | 'deny';
}

@Entity({ name: 'audit_logs' })
@Index(['occurredAt'])
export class AuditLog {
	@PrimaryGeneratedColumn('uuid')
	id: string;
	@CreateDateColumn({ name: 'occurred_at', type: 'timestamp' }) occurredAt: Date;
	@Column({ name: 'actor_id', type: 'integer', nullable: true }) actorId: number | null;
	@Column() action: string;
	@Column() category: string;
	@Column({ name: 'resource_type' }) resourceType: string;
	@Column({ name: 'resource_id', nullable: true }) resourceId: string | null;
	@Column({ default: 'success' }) outcome: string;
	@Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) changes: Record<string, unknown>;
	@Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) context: Record<string, unknown>;
	@Column() hash: string;
	@Column({ name: 'prev_hash', nullable: true }) prevHash: string | null;
}

@Entity({ name: 'rate_limit_buckets' })
export class RateLimitBucket {
	@PrimaryColumn() key: string;
	@Column({ type: 'integer' }) count: number;
	@Column({ name: 'window_ends_at', type: 'timestamp' }) windowEndsAt: Date;
}

@Entity({ name: 'jobs' })
export class Job {
	@PrimaryGeneratedColumn('uuid')
	id: string;
	@Column() type: string;
	@Column({ default: 'queued' }) status: string;
	@Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) payload: Record<string, unknown>;
	@Column({ name: 'attempts', default: 0 }) attempts: number;
	@Column({ name: 'run_at', type: 'timestamp' }) runAt: Date;
	@Column({ name: 'completed_at', type: 'timestamp', nullable: true }) completedAt: Date | null;
	@CreateDateColumn({ name: 'created_at', type: 'timestamp' }) createdAt: Date;
}
