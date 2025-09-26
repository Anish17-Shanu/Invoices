// src/modules/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../../entities/payment.entity';
import { Invoice } from '../../entities/invoice.entity';
import { EventModule } from '../event/event.module'; // Import EventModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Invoice]),
    EventModule, // ✅ Provides EventService to PaymentsService
  ],
  providers: [PaymentsService],
  controllers: [PaymentsController],
  exports: [PaymentsService],
})
export class PaymentsModule {}
