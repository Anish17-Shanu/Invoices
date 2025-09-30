import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { CoreModule } from './core/core.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { BusinessPartnersModule } from './modules/business-partners/business-partners.module';
import { ProductsServicesModule } from './modules/products-services/products-services.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { EventModule } from './modules/event/event.module';
import { AuthModule } from './modules/auth/auth.module';

import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    CoreModule,
    AuthModule,                // Global auth handled inside AuthModule
    OrganizationsModule,       // No global guard; controller handles guards per route
    BusinessPartnersModule,    
    ProductsServicesModule,    
    InvoicesModule,            
    PaymentsModule,            
    ComplianceModule,          
    EventModule,               
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
