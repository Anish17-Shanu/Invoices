import { Test, TestingModule } from '@nestjs/testing';
import { EventListener } from './event.listener';
import { Logger } from '@nestjs/common';

describe('EventListener', () => {
  let listener: EventListener;

  const mockLogger = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(mockLogger.log);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventListener],
    }).compile();

    listener = module.get<EventListener>(EventListener);
  });

  afterEach(() => jest.clearAllMocks());

  it('should log invoice created event', () => {
    listener.handleInvoiceCreated({ invoiceId: 'inv-1', partnerId: 'p1' });
    expect(mockLogger.log).toHaveBeenCalledWith(
      'Invoice Created: inv-1 for Partner: p1',
    );
  });

  it('should log invoice updated event', () => {
    listener.handleInvoiceUpdated({ invoiceId: 'inv-2' });
    expect(mockLogger.log).toHaveBeenCalledWith('Invoice Updated: inv-2');
  });

  it('should log payment received event', () => {
    listener.handlePaymentReceived({
      paymentId: 'pay-1',
      invoiceId: 'inv-3',
      amount: 1000,
    });
    expect(mockLogger.log).toHaveBeenCalledWith(
      'Payment Received: pay-1 for Invoice: inv-3, Amount: 1000',
    );
  });

  it('should log product created event', () => {
    listener.handleProductCreated({ productId: 'prod-1' });
    expect(mockLogger.log).toHaveBeenCalledWith('Product Created: prod-1');
  });

  it('should log product updated event', () => {
    listener.handleProductUpdated({ productId: 'prod-2' });
    expect(mockLogger.log).toHaveBeenCalledWith('Product Updated: prod-2');
  });

  it('should log partner created event', () => {
    listener.handlePartnerCreated({ partnerId: 'partner-1' });
    expect(mockLogger.log).toHaveBeenCalledWith('Partner Created: partner-1');
  });

  it('should log partner updated event', () => {
    listener.handlePartnerUpdated({ partnerId: 'partner-2' });
    expect(mockLogger.log).toHaveBeenCalledWith('Partner Updated: partner-2');
  });

  it('should log ewaybill generated event', () => {
    listener.handleEwayBillGenerated({
      ewbId: 'ewb-1',
      invoiceId: 'inv-4',
    });
    expect(mockLogger.log).toHaveBeenCalledWith(
      'E-Way Bill Generated: ewb-1 for Invoice: inv-4',
    );
  });

  it('should log gstr filed event', () => {
    listener.handleGstrFiled({
      filingId: 'gstr-1',
      organizationId: 'org-1',
      period: '2025-09',
    });
    expect(mockLogger.log).toHaveBeenCalledWith(
      'GSTR Filed: gstr-1 for Organization: org-1 (2025-09)',
    );
  });
});
