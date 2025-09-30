import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEvent } from '../../common/enums/app-event.enum';

describe('EventService', () => {
  let service: EventService;
  let emitter: EventEmitter2;

  const mockEmitter = {
    emit: jest.fn(),
    on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
    emitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => jest.clearAllMocks());

  it('should emit an event with payload', () => {
    const payload = { invoiceId: 'inv-1' };
    service.emit(AppEvent.INVOICE_CREATED, payload);

    expect(emitter.emit).toHaveBeenCalledWith(AppEvent.INVOICE_CREATED, payload);
  });

  it('should register a listener for an event', () => {
    const listener = jest.fn();
    service.on(AppEvent.INVOICE_UPDATED, listener);

    expect(emitter.on).toHaveBeenCalledWith(AppEvent.INVOICE_UPDATED, listener);
  });
});
