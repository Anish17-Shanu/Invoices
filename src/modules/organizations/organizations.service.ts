import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationQueryDto } from './dto/organization.dto';
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
  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    try {
      // Step 1: Create and save to get orgId
      let organization = this.organizationRepository.create(createOrganizationDto);
      organization = await this.organizationRepository.save(organization);

      // Step 2: Generate workspaceId (ORG-<orgId>-<short-uuid>)
      const shortId = uuidv4().split('-')[0]; // short, unique suffix
      organization.workspaceId = `ORG-${organization.organizationId}-${shortId}`;

      // Step 3: Save again with workspaceId
      const saved = await this.organizationRepository.save(organization);

      this.logger.log(
        `Created organization: ${saved.organizationId} with workspaceId: ${saved.workspaceId}`,
      );

      // 🔹 Emit organization.created event
      this.eventService.emit(AppEvent.PARTNER_CREATED, {
        organizationId: saved.organizationId,
        workspaceId: saved.workspaceId,
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

  // -------------------- GET ORGANIZATIONS --------------------
  async findAll(query: OrganizationQueryDto) {
    const {
      search,
      workspaceId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const qb = this.organizationRepository.createQueryBuilder('org');

    if (search) qb.andWhere('org.name ILIKE :search', { search: `%${search}%` });
    if (workspaceId) qb.andWhere('org.workspaceId = :workspaceId', { workspaceId });

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
    const organization = await this.organizationRepository.findOne({ where: { organizationId } });
    if (!organization) throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    return organization;
  }

  // -------------------- GET ORGANIZATIONS BY WORKSPACE --------------------
  async findByWorkspace(workspaceId: string): Promise<Organization[]> {
    return this.organizationRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  // -------------------- UPDATE ORGANIZATION --------------------
  async update(organizationId: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(organizationId);

    try {
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
        if (error.constraint?.includes('gstin')) throw new ConflictException('GSTIN already exists');
        if (error.constraint?.includes('pan')) throw new ConflictException('PAN already exists');
      }
      throw error;
    }
  }

  // -------------------- DELETE ORGANIZATION --------------------
  async remove(organizationId: string): Promise<void> {
    const result = await this.organizationRepository.delete(organizationId);
    if (result.affected === 0) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }
    this.logger.log(`Deleted organization: ${organizationId}`);

    // Optionally emit deletion event
    // this.eventService.emit(AppEvent.PARTNER_DELETED, { organizationId });
  }
}
