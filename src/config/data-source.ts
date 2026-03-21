import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { 
  GstrFiling, 
  Organization, 
  EwayBill, 
  Invoice, 
  User, 
  BusinessPartner, 
  ProductsServices, 
  Payment, 
  InvoiceItem 
} from '../entities'; // Only import actual entities

dotenv.config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME', 'invoices_user'),
  password: configService.get<string>('DATABASE_PASSWORD', 'change_me'),
  database: configService.get<string>('DATABASE_NAME', 'invoices_db'),
  schema: 'invoices',
  ssl: configService.get<string>('DATABASE_SSL') === 'true',
  entities: [
    GstrFiling,
    Organization,
    EwayBill,
    Invoice,
    User,
    BusinessPartner,
    ProductsServices,
    Payment,
    InvoiceItem,
  ],
  migrations: ['dist/migrations/*.js'],
  synchronize: false, // Set to false in production
  logging: configService.get<string>('NODE_ENV') === 'development',
});
