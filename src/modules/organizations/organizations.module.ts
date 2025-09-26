import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from '../../entities/organization.entity';
import { EventModule } from '../event/event.module'; // ✅ Import EventModule

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization]),
    EventModule, // ✅ Needed for EventService injection
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
