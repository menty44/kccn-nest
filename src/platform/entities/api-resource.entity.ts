import { BeforeInsert, Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { randomBytes } from 'crypto';

@Entity({ name: 'api_resources' })
@Index(['resourceType', 'deletedAt'])
@Index(['ownerId', 'resourceType'])
export class ApiResource {
	@PrimaryColumn({ type: 'uuid' })
	id: string;

	@Column({ name: 'resource_type', type: 'varchar', length: 100 })
	resourceType: string;

	@Column({ name: 'owner_id', type: 'varchar', length: 100, nullable: true })
	ownerId: string | null;

	@Column({ type: 'varchar', length: 40, default: 'active' })
	status: string;

	@Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
	data: Record<string, unknown>;

	@Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
	deletedAt: Date | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamp' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
	updatedAt: Date;

	@BeforeInsert()
	assignId(): void {
		if (!this.id) {
			this.id = this.uuidV7();
		}
	}

	private uuidV7(): string {
		const timestamp = Date.now().toString(16).padStart(12, '0');
		const random = randomBytes(10).toString('hex');
		const variant = (8 + (parseInt(random[3], 16) & 0x3)).toString(16);

		return `${timestamp.slice(0, 8)}-${timestamp.slice(8)}-7${random.slice(0, 3)}-${variant}${random.slice(4, 7)}-${random.slice(7, 19)}`;
	}
}
