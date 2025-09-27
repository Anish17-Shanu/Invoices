import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsServicesController } from './products-services.controller';
import { ProductsServicesService } from './products-services.service';
import { ProductsServices } from '../../entities/products-services.entity';
import { EventModule } from '../event/event.module'; // <-- import EventModule

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductsServices]),
    EventModule, // <-- makes EventService available for DI
  ],
  controllers: [ProductsServicesController],
  providers: [ProductsServicesService],
  exports: [ProductsServicesService],
})
export class ProductsServicesModule {}
