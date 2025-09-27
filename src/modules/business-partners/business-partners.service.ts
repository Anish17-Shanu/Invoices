import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { BusinessPartner } from '../../entities/business-partner.entity';
import { Invoice } from '../../entities/invoice.entity';
import { 
  CreateBusinessPartnerDto, 
  UpdateBusinessPartnerDto, 
  BusinessPartnerQueryDto, 
  BusinessPartnerResponseDto, 
  InvoiceSummaryDto 
} from './dto/business-partner.dto';
import { EventService } from '../event/event.service';
import { AppEvent } from '../../common/enums/app-event.enum';
import { RequestUser } from '../../common/interfaces/auth.interface';

@Injectable()
export class BusinessPartnersService {
  constructor(
    @InjectRepository(BusinessPartner)
    private readonly partnersRepo: Repository<BusinessPartner>,

    @InjectRepository(Invoice)
    private readonly invoicesRepo: Repository<Invoice>,

    private readonly eventService: EventService,
  ) {}

  // 🔹 Create a new partner
  async create(dto: CreateBusinessPartnerDto, user: RequestUser): Promise<BusinessPartnerResponseDto> {
    if (dto.gstin) {
      const exists = await this.partnersRepo.findOne({ where: { gstin: dto.gstin } });
      if (exists) throw new BadRequestException('GSTIN already exists');
    }
    if (dto.pan) {
      const exists = await this.partnersRepo.findOne({ where: { pan: dto.pan } });
      if (exists) throw new BadRequestException('PAN already exists');
    }

    const partner = this.partnersRepo.create(dto);
    await this.partnersRepo.save(partner);

    // 🔹 Emit event after creation
    this.eventService.emit(AppEvent.PARTNER_CREATED, {
      partnerId: partner.partnerId,
      organizationId: partner.organizationId,
      name: partner.name,
      type: partner.type,
      createdBy: user.userId, // optional audit info
    });

    return this.toResponseDto(partner);
  }

  // 🔹 Get all partners with filters, search, pagination
  async findAll(query: BusinessPartnerQueryDto, user: RequestUser): Promise<BusinessPartnerResponseDto[]> {
    const { page = 1, limit = 10, type, search } = query;

    const where: any = {};
    if (type) where.type = type;
    if (search) where.name = ILike(`%${search}%`);

    const partners = await this.partnersRepo.find({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return Promise.all(partners.map(p => this.toResponseDto(p, true)));
  }

  // 🔹 Get single partner by ID
  async findOne(id: string, user: RequestUser): Promise<BusinessPartnerResponseDto> {
    const partner = await this.partnersRepo.findOne({ where: { partnerId: id } });
    if (!partner) throw new NotFoundException('Partner not found');
    return this.toResponseDto(partner, true);
  }

  // 🔹 Update a partner
  async update(id: string, dto: UpdateBusinessPartnerDto, user: RequestUser): Promise<BusinessPartnerResponseDto> {
    const partner = await this.partnersRepo.findOne({ where: { partnerId: id } });
    if (!partner) throw new NotFoundException('Partner not found');

    Object.assign(partner, dto);
    await this.partnersRepo.save(partner);

    // 🔹 Emit event after update
    this.eventService.emit(AppEvent.PARTNER_UPDATED, {
      partnerId: partner.partnerId,
      organizationId: partner.organizationId,
      name: partner.name,
      type: partner.type,
      updatedBy: user.userId, // optional audit info
    });

    return this.toResponseDto(partner);
  }

  // 🔹 Delete a partner
  async remove(id: string, user: RequestUser): Promise<void> {
    const partner = await this.partnersRepo.findOne({ where: { partnerId: id } });
    if (!partner) throw new NotFoundException('Partner not found');

    await this.partnersRepo.remove(partner);

    // 🔹 Optionally emit a partner deleted event
    // this.eventService.emit(AppEvent.PARTNER_DELETED, {
    //   partnerId: partner.partnerId,
    //   deletedBy: user.userId,
    // });
  }

  // 🔹 Helper: Convert entity to response DTO
  private async toResponseDto(partner: BusinessPartner, includeInvoices = false): Promise<BusinessPartnerResponseDto> {
    const dto: BusinessPartnerResponseDto = {
      partnerId: partner.partnerId,
      organizationId: partner.organizationId,
      name: partner.name,
      type: partner.type,
      gstin: partner.gstin,
      pan: partner.pan,
      billingAddress: partner.billingAddress,
      shippingAddress: partner.shippingAddress,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      invoices: undefined,
    };

    if (includeInvoices) {
      const invoices = await this.invoicesRepo.find({
        where: { partnerId: partner.partnerId },
        select: ['invoiceId', 'invoiceNumber', 'status', 'totalAmount'],
      });
      dto.invoices = invoices.map((inv): InvoiceSummaryDto => ({
        invoiceId: inv.invoiceId,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        totalAmount: inv.totalAmount,
      }));
    }

    return dto;
  }
}
