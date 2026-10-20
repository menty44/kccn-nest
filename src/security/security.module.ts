import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
	AuditLog,
	Job,
	Permission,
	RateLimitBucket,
	Role,
	RolePermission,
	UserPermissionOverride,
	UserRole,
} from './entities/security.entity';
import { SecurityService } from './security.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Role,
			Permission,
			RolePermission,
			UserRole,
			UserPermissionOverride,
			AuditLog,
			RateLimitBucket,
			Job,
		]),
	],
	providers: [SecurityService],
	exports: [SecurityService],
})
export class SecurityModule {}
