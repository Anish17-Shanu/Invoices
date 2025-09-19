import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as entities from '../entities';

dotenv.config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST', 'localhost'),
  port: configService.get('DATABASE_PORT', 5432),
  username: configService.get('DATABASE_USERNAME', 'flocci_user'),
  password: configService.get('DATABASE_PASSWORD', 'flocci_password'),
  database: configService.get('DATABASE_NAME', 'flocci_invoices'),
  ssl: configService.get('DATABASE_SSL') === 'true',
  entities: Object.values(entities),
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Set to false in production
  logging: configService.get('NODE_ENV') === 'development',
});
