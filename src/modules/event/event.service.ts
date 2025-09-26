import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvent } from '../../common/enums/app-event.enum';

@Injectable()
export class EventService {
  constructor(private readonly emitter: EventEmitter2) {}

  /**
   * Emit an event with optional payload
   */
  emit<T = any>(event: AppEvent, payload?: T) {
    this.emitter.emit(event, payload);
  }

  /**
   * Listen to an event
   */
  on<T = any>(event: AppEvent, listener: (payload: T) => void) {
    this.emitter.on(event, listener);
  }
}
