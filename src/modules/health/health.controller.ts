import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/auth.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get()
  async check() {
    let database = 'ok';

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      database = 'unavailable';
    }

    return {
      service: 'invoices-srv',
      status: database === 'ok' ? 'ok' : 'degraded',
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
