import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'flocci_user',
  password: process.env.DATABASE_PASSWORD || 'flocci_password',
  database: process.env.DATABASE_NAME || 'flocci_invoices',
  ssl: process.env.DATABASE_SSL === 'true',
}));
