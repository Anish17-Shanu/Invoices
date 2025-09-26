import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { WinstonModule } from 'nest-winston';
import databaseConfig from '../config/database.config';
import { winstonConfig } from '../config/winston.config';
import {
  GstrFiling,
  Organization,
  EwayBill,
  Invoice,
  User,
  BusinessPartner,
  ProductService,
  Payment,
  InvoiceItem,
} from '../entities'; // only entity classes

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        schema: 'flocci',
        ssl: configService.get<boolean>('database.ssl'),
        entities: [
          GstrFiling,
          Organization,
          EwayBill,
          Invoice,
          User,
          BusinessPartner,
          ProductService,
          Payment,
          InvoiceItem,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') 
        },
      }),
    }),
    WinstonModule.forRoot(winstonConfig),
  ],
  exports: [ConfigModule, TypeOrmModule, JwtModule, WinstonModule],
})
export class CoreModule {}
