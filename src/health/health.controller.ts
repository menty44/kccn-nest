import { Controller, Get } from '@nestjs/common';
import {
	HealthCheckService,
	HttpHealthIndicator,
	HealthCheck,
	TypeOrmHealthIndicator,
	DiskHealthIndicator,
	MemoryHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
		private db: TypeOrmHealthIndicator,
		private readonly disk: DiskHealthIndicator,
		private memory: MemoryHealthIndicator,
	) {}

	@Get()
	@HealthCheck()
	check() {
		return this.health.check([
			() => this.http.pingCheck('gospel', 'http://localhost:3000'),
			() => this.db.pingCheck('database', { timeout: 1000 }),
			() => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
			() => this.disk.checkStorage('storage', { path: '/', threshold: 250 * 1024 * 1024 * 1024 }),
			() => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
			() => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
		]);
	}
}
