import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { EwayBill } from '../../entities/eway-bill.entity';
import { GstrFiling } from '../../entities/gstr-filing.entity';
import { Invoice } from '../../entities/invoice.entity';
import { EventModule } from '../event/event.module'; // ✅ Import EventModule

@Module({
  imports: [
    TypeOrmModule.forFeature([EwayBill, GstrFiling, Invoice]),
    EventModule, // ✅ Make EventService available
  ],
  providers: [ComplianceService],
  controllers: [ComplianceController],
  exports: [ComplianceService],
})
export class ComplianceModule {}
