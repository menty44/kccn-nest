import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sessions' })
@Index(['userId', 'revokedAt'])
export class Session {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ name: 'user_id', type: 'integer' })
	userId: number;

	@Column({ name: 'refresh_hash', type: 'varchar', length: 100 })
	refreshHash: string;

	@Column({ name: 'family_id', type: 'uuid' })
	familyId: string;

	@Column({ name: 'expires_at', type: 'timestamp' })
	expiresAt: Date;

	@Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
	revokedAt: Date | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamp' })
	createdAt: Date;
}
