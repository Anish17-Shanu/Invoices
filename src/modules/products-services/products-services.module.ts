import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsServicesService } from './products-services.service';
import { ProductsServicesController } from './products-services.controller';
import { ProductService } from '../../entities/product-service.entity';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    EventModule, // ✅ Import first
    TypeOrmModule.forFeature([ProductService]),
  ],
  providers: [ProductsServicesService],
  controllers: [ProductsServicesController],
  exports: [ProductsServicesService, TypeOrmModule],
})
export class ProductsServicesModule {}
