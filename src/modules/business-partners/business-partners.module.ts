import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessPartnersService } from './business-partners.service';
import { BusinessPartnersController } from './business-partners.controller';
import { BusinessPartner } from '../../entities/business-partner.entity';
import { Invoice } from '../../entities/invoice.entity';
import { EventModule } from '../event/event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BusinessPartner, Invoice]), 
    EventModule, // ✅ Allows using EventService if needed
  ],
  controllers: [BusinessPartnersController],
  providers: [BusinessPartnersService],
  exports: [BusinessPartnersService],
})
export class BusinessPartnersModule {}
