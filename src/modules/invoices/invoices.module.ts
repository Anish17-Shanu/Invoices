import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { Invoice } from '../../entities/invoice.entity';
import { InvoiceItem } from '../../entities/invoice-item.entity';
import { Organization } from '../../entities/organization.entity';
import { BusinessPartner } from '../../entities/business-partner.entity';
import { Payment } from '../../entities/payment.entity';
import { EwayBill } from '../../entities/eway-bill.entity';
import { EventModule } from '../event/event.module';
import { ProductsServicesModule } from '../products-services/products-services.module'; // ← Import this

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceItem,
      Organization,
      BusinessPartner,
      Payment,
      EwayBill,
    ]),
    EventModule, 
    ProductsServicesModule, // ← Add here
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
