import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventService } from './event.service';
import { EventListener } from './event.listener';

@Module({
  imports: [EventEmitterModule.forRoot({ wildcard: true })],
  providers: [EventService, EventListener],
  exports: [EventService], // <-- Export only EventService
})
export class EventModule {}
