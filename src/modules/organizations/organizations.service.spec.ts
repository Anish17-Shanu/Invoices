import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { EventService } from '../event/event.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AppEvent } from '../../common/enums/app-event.enum';
import { OrganizationQueryDto } from './dto/organization.dto';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repo: jest.Mocked<Repository<Organization>>;
  let eventService: jest.Mocked<EventService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: getRepositoryToken(Organization),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: EventService,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    repo = module.get(getRepositoryToken(Organization));
    eventService = module.get(EventService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create and return organization', async () => {
      const dto = { name: 'Org1' } as any;
      const org = { organizationId: '1', name: 'Org1' } as Organization;

      repo.create.mockReturnValue(org);
      repo.save.mockResolvedValue(org);

      const result = await service.create(dto);

      expect(result).toEqual(org);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(org);
      expect(eventService.emit).toHaveBeenCalledWith(
        AppEvent.PARTNER_CREATED,
        expect.any(Object),
      );
    });

    it('should throw ConflictException on duplicate gstin', async () => {
      repo.create.mockReturnValue({} as Organization);
      repo.save.mockRejectedValue({ code: '23505', constraint: 'unique_gstin' });

      await expect(service.create({} as any)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate pan', async () => {
      repo.create.mockReturnValue({} as Organization);
      repo.save.mockRejectedValue({ code: '23505', constraint: 'unique_pan' });

      await expect(service.create({} as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('createDefaultOrgForUser', () => {
    it('should call create with defaults', async () => {
      const org = { organizationId: '1', name: 'Org-test' } as Organization;
      jest.spyOn(service, 'create').mockResolvedValue(org);

      const result = await service.createDefaultOrgForUser('test@example.com');

      expect(result).toEqual(org);
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      };

      repo.createQueryBuilder.mockReturnValue(qb);

      const query: OrganizationQueryDto = {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };

      const result = await service.findAll(query);

      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return organization', async () => {
      const org = { organizationId: '1', name: 'Org1' } as Organization;
      repo.findOne.mockResolvedValue(org);

      const result = await service.findOne('1');
      expect(result).toEqual(org);
    });

    it('should throw NotFoundException', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return organization', async () => {
      const org = { organizationId: '1', name: 'Org1' } as Organization;
      jest.spyOn(service, 'findOne').mockResolvedValue(org);
      repo.save.mockResolvedValue(org);

      const result = await service.update('1', { name: 'Updated Org' } as any);

      expect(result).toEqual(org);
      expect(eventService.emit).toHaveBeenCalledWith(
        AppEvent.PARTNER_UPDATED,
        expect.any(Object),
      );
    });

    it('should throw ConflictException on duplicate gstin', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({} as Organization);
      repo.save.mockRejectedValue({ code: '23505', constraint: 'unique_gstin' });

      await expect(service.update('1', {} as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete organization', async () => {
      const deleteResult: DeleteResult = { affected: 1, raw: {} };
      repo.delete.mockResolvedValue(deleteResult);

      await service.remove('1');
      expect(repo.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if nothing deleted', async () => {
      const deleteResult: DeleteResult = { affected: 0, raw: {} };
      repo.delete.mockResolvedValue(deleteResult);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
