// src/modules/organizations/organizations.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  OrganizationQueryDto,
} from './dto/organization.dto';
import { EventService } from '../event/event.service';
import { AppEvent } from '../../common/enums/app-event.enum';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private readonly eventService: EventService,
  ) {}

  // -------------------- CREATE ORGANIZATION --------------------
  async create(
    createOrganizationDto: Partial<CreateOrganizationDto>,
  ): Promise<Organization> {
    try {
      const shortId = uuidv4().split('-')[0];

      const pan = createOrganizationDto.pan ?? `PAN-${shortId}`.slice(0, 10);
      const gstin = createOrganizationDto.gstin ?? `GSTIN-${shortId}`.slice(0, 15);
      const name = createOrganizationDto.name ?? `Org-${shortId}`;

      // WorkspaceId is internal only, not from DTO
      const organization = this.organizationRepository.create({
        ...createOrganizationDto,
        gstin,
        pan,
        name,
        workspaceId: uuidv4(),
      });

      const saved = await this.organizationRepository.save(organization);

      this.logger.log(`Created organization: ${saved.organizationId}`);

      // Emit event after creation
      this.eventService.emit(AppEvent.PARTNER_CREATED, {
        organizationId: saved.organizationId,
        name: saved.name,
      });

      return saved;
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint?.includes('gstin')) {
          throw new ConflictException('GSTIN already exists');
        }
        if (error.constraint?.includes('pan')) {
          throw new ConflictException('PAN already exists');
        }
      }
      throw error;
    }
  }

  // -------------------- CREATE DEFAULT ORG FOR USER --------------------
  async createDefaultOrgForUser(userEmail: string): Promise<Organization> {
    const shortId = uuidv4().split('-')[0];
    const defaultOrg: Partial<CreateOrganizationDto> = {
      name: `Org-${userEmail.split('@')[0]}`,
      gstin: `GSTIN-${shortId}`.slice(0, 15),
      pan: `PAN-${shortId}`.slice(0, 10),
    };

    return this.create(defaultOrg);
  }

  // -------------------- GET ORGANIZATIONS --------------------
  async findAll(query: OrganizationQueryDto) {
    const { search, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

    const qb = this.organizationRepository.createQueryBuilder('org');

    if (search) qb.andWhere('org.name ILIKE :search', { search: `%${search}%` });

    qb.orderBy(`org.${sortBy}`, sortOrder as 'ASC' | 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // -------------------- GET SINGLE ORGANIZATION --------------------
  async findOne(organizationId: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { organizationId },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    return organization;
  }

  // -------------------- UPDATE ORGANIZATION --------------------
  async update(
    organizationId: string,
    updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.findOne(organizationId);

    try {
      // Keep workspaceId internal, don't allow updating via DTO
      Object.assign(organization, updateOrganizationDto);

      const updated = await this.organizationRepository.save(organization);

      this.logger.log(`Updated organization: ${organizationId}`);

      this.eventService.emit(AppEvent.PARTNER_UPDATED, {
        organizationId,
        name: updated.name,
      });

      return updated;
    } catch (error) {
      if (error.code === '23505') {
        if (error.constraint?.includes('gstin')) {
          throw new ConflictException('GSTIN already exists');
        }
        if (error.constraint?.includes('pan')) {
          throw new ConflictException('PAN already exists');
        }
      }
      throw error;
    }
  }

  // -------------------- DELETE ORGANIZATION --------------------
  async remove(organizationId: string): Promise<void> {
    const result = await this.organizationRepository.delete(organizationId);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Organization with ID ${organizationId} not found`,
      );
    }

    this.logger.log(`Deleted organization: ${organizationId}`);
  }
}
