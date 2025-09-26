import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { CoreModule } from './core/core.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { BusinessPartnersModule } from './modules/business-partners/business-partners.module';
import { ProductsServicesModule } from './modules/products-services/products-services.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { EventModule } from './modules/event/event.module';
import { AuthGuard } from './common/guards/auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    CoreModule,                // Shared providers: Config, Logger, EventService, etc.
    OrganizationsModule,       // Organization CRUD
    BusinessPartnersModule,    // Partners CRUD
    ProductsServicesModule,    // Products & Services CRUD
    InvoicesModule,            // Invoice management
    PaymentsModule,            // Payments management
    ComplianceModule,          // E-Way & GSTR management
    EventModule,               // Central event emitter
    AuthModule, // ← Add this

  ],
  providers: [
    // 🔹 Global Auth Guard
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },

    // 🔹 Global Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // 🔹 Global Transform Interceptor (DTO serialization / response shaping)
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // 🔹 Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
