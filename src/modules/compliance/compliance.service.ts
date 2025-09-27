import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EwayBill } from '../../entities/eway-bill.entity';
import { GstrFiling, GstrFilingStatus } from '../../entities/gstr-filing.entity';
import { Invoice } from '../../entities/invoice.entity';
import {
  CreateEwayBillDto,
  EwayBillResponseDto,
  GenerateGstrDto,
  GstrFilingResponseDto,
  VehicleDetailsDto,
  EwayBillStatus,
} from './dto/compliance.dto';
import { EventService } from '../event/event.service';
import { AppEvent } from '../../common/enums/app-event.enum';
import { RequestUser } from '../../common/interfaces/auth.interface';

@Injectable()
export class ComplianceService {
  constructor(
    @InjectRepository(EwayBill)
    private readonly ewayBillRepo: Repository<EwayBill>,
    @InjectRepository(GstrFiling)
    private readonly gstrFilingRepo: Repository<GstrFiling>,
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly eventService: EventService, // Inject EventService
  ) {}

  // -------------------- E-WAY BILL --------------------
  async createEwayBill(dto: CreateEwayBillDto, user: RequestUser): Promise<EwayBillResponseDto> {
    const invoice = await this.invoiceRepo.findOne({ where: { invoiceId: dto.invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const existing = await this.ewayBillRepo.findOne({ where: { ewbNumber: dto.ewbNumber } });
    if (existing) throw new BadRequestException('E-Way Bill number already exists');

    const ewayBill = this.ewayBillRepo.create({ ...dto, invoice });
    await this.ewayBillRepo.save(ewayBill);

    // Emit event after E-Way Bill creation
    this.eventService.emit(AppEvent.EWAY_BILL_CREATED, {
      ewbId: ewayBill.ewbId,
      invoiceId: ewayBill.invoiceId,
      organizationId: ewayBill.invoice.organizationId,
      createdBy: user.userId,
    });

    return this.toEwayBillResponseDto(ewayBill);
  }

  async getEwayBillByInvoice(invoiceId: string, user?: RequestUser): Promise<EwayBillResponseDto[]> {
    const invoice = await this.invoiceRepo.findOne({ where: { invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const bills = await this.ewayBillRepo.find({ where: { invoiceId } });
    return bills.map(this.toEwayBillResponseDto);
  }

  async updateEwayBill(
    ewbId: string,
    dto: Partial<CreateEwayBillDto>,
    user: RequestUser,
  ): Promise<EwayBillResponseDto> {
    const bill = await this.ewayBillRepo.findOne({ where: { ewbId }, relations: ['invoice'] });
    if (!bill) throw new NotFoundException('E-Way Bill not found');

    Object.assign(bill, dto);
    await this.ewayBillRepo.save(bill);

    // Emit event after E-Way Bill update
    this.eventService.emit(AppEvent.EWAY_BILL_UPDATED, {
      ewbId: bill.ewbId,
      invoiceId: bill.invoiceId,
      organizationId: bill.invoice.organizationId,
      updatedBy: user.userId,
    });

    return this.toEwayBillResponseDto(bill);
  }

  private toEwayBillResponseDto(bill: EwayBill): EwayBillResponseDto {
    return {
      ewbId: bill.ewbId,
      invoiceId: bill.invoiceId,
      ewbNumber: bill.ewbNumber,
      validFrom: bill.validFrom,
      validUntil: bill.validUntil,
      vehicleDetails: bill.vehicleDetails
        ? {
            ...bill.vehicleDetails,
            transporterDocDate: bill.vehicleDetails.transporterDocDate
              ? bill.vehicleDetails.transporterDocDate.toISOString().split('T')[0]
              : undefined,
          } as VehicleDetailsDto
        : undefined,
      status: bill.status as EwayBillStatus,
      createdAt: bill.createdAt,
    };
  }

  // -------------------- GSTR FILING --------------------
  async generateGstr(
    dto: GenerateGstrDto,
    organizationId: string,
    user: RequestUser,
  ): Promise<GstrFilingResponseDto> {
    const existing = await this.gstrFilingRepo.findOne({
      where: { organizationId, type: dto.type, period: dto.period },
    });
    if (existing) throw new BadRequestException('GSTR filing already exists for this period');

    const filing = this.gstrFilingRepo.create({
      organizationId,
      type: dto.type,
      period: dto.period,
      status: GstrFilingStatus.PENDING,
    });

    await this.gstrFilingRepo.save(filing);

    // Emit event after GSTR filing generation
    this.eventService.emit(AppEvent.GSTR_FILING_GENERATED, {
      filingId: filing.filingId,
      organizationId: filing.organizationId,
      period: filing.period,
      type: filing.type,
      createdBy: user.userId,
    });

    return this.toGstrFilingResponseDto(filing);
  }

  async getGstrFilings(organizationId: string, user?: RequestUser): Promise<GstrFilingResponseDto[]> {
    const filings = await this.gstrFilingRepo.find({ where: { organizationId } });
    return filings.map(this.toGstrFilingResponseDto);
  }

  async updateGstrFiling(
    filingId: string,
    status: GstrFilingStatus,
    payload?: Record<string, any>,
    filedAt?: Date,
    user?: RequestUser,
  ): Promise<GstrFilingResponseDto> {
    const filing = await this.gstrFilingRepo.findOne({ where: { filingId } });
    if (!filing) throw new NotFoundException('GSTR filing not found');

    filing.status = status;
    if (payload) filing.payload = payload;
    if (filedAt) filing.filedAt = filedAt;

    await this.gstrFilingRepo.save(filing);

    // Emit event after GSTR filing update
    this.eventService.emit(AppEvent.GSTR_FILING_UPDATED, {
      filingId: filing.filingId,
      organizationId: filing.organizationId,
      status: filing.status,
      updatedBy: user?.userId,
    });

    return this.toGstrFilingResponseDto(filing);
  }

  private toGstrFilingResponseDto(filing: GstrFiling): GstrFilingResponseDto {
    return {
      filingId: filing.filingId,
      organizationId: filing.organizationId,
      type: filing.type,
      period: filing.period,
      status: filing.status,
      payload: filing.payload,
      filedAt: filing.filedAt,
      createdAt: filing.createdAt,
    };
  }
}
