import { Entity, Column, PrimaryGeneratedColumn, Generated, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	@Generated('uuid')
	uuid: string;

	@Column()
	firstName: string;

	@Column()
	lastName: string;

	@Column({
		nullable: false,
		type: 'varchar',
		length: 150,
		unique: true,
	})
	email: string;

	@Column({
		nullable: false,
		type: 'varchar',
		length: 150,
		unique: true,
	})
	phone: string;

	@Column()
	country: string;

	@Column()
	gender: string;

	@Column()
	password: string;

	@Column({ default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e' })
	avatar: string;

	@Column({ default: false })
	isEmailVerified: boolean;

	@Column({ default: true })
	isActive: boolean;

	@Column({ default: false })
	isAdmin: boolean;

	@Column({ default: false })
	isBlocked: boolean;

	@CreateDateColumn({ type: 'timestamp' })
	created_at: Date;

	@UpdateDateColumn({ type: 'timestamp' })
	updated_at: Date;
}
