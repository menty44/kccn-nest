import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Otp {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 12 })
	code: string;

	@Column({ type: 'integer' })
	userid: number;

	@CreateDateColumn({ type: 'timestamptz' })
	created_at: Date;
}
