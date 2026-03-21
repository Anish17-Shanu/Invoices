import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'invoices_user',
  password: process.env.DATABASE_PASSWORD || 'change_me',
  database: process.env.DATABASE_NAME || 'invoices_db',
  schema: 'invoices',
  ssl: process.env.DATABASE_SSL === 'true',
}));
