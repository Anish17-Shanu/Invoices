import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CoreModule } from './core/core.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AuthGuard } from './common/guards/auth.guard';

@Module({
  imports: [
    CoreModule,
    OrganizationsModule,
    // BusinessPartnersModule,
    // ProductsServicesModule,
    // InvoicesModule,
    // PaymentsModule,
    // ComplianceModule,
    // EventModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
