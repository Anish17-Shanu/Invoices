import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    try {
      const organization = this.organizationRepository.create(createOrganizationDto);
      const saved = await this.organizationRepository.save(organization);
      
      this.logger.log(`Created organization: ${saved.organizationId}`);
      return saved;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
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

  async findOne(organizationId: string): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    return organization;
  }

  async findByWorkspace(workspaceId: string): Promise<Organization[]> {
    return this.organizationRepository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(organizationId: string, updateOrganizationDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.findOne(organizationId);
    
    try {
      Object.assign(organization, updateOrganizationDto);
      const updated = await this.organizationRepository.save(organization);
      
      this.logger.log(`Updated organization: ${organizationId}`);
      return updated;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
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

  async remove(organizationId: string): Promise<void> {
    const result = await this.organizationRepository.delete(organizationId);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }
    
    this.logger.log(`Deleted organization: ${organizationId}`);
  }
}
