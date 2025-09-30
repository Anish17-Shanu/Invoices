// src/modules/organizations/organizations.controller.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ExecutionContext, CanActivate } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationsModule } from './organizations.module';
import { Organization } from '../../entities/organization.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OrganizationType } from '@/common/enums';

describe('OrganizationsController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<Organization>;

  const mockOrganization: Organization = {
    organizationId: '123e4567-e89b-12d3-a456-426614174000',
    workspaceId: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Org',
    legalName: 'Test Org Pvt Ltd',
    gstin: '12ABCDE1234F1Z5',
    pan: 'ABCDE1234F',
    type: OrganizationType.PROPRIETORSHIP,
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '123456',
      country: 'India',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    businessPartners: [],
    productsServices: [],
    invoices: [],
    payments: [],
    gstrFilings: [],
  };

  const mockRepository = {
    create: jest.fn().mockReturnValue(mockOrganization),
    save: jest.fn().mockResolvedValue(mockOrganization),
    findOne: jest.fn().mockResolvedValue(mockOrganization),
    find: jest.fn().mockResolvedValue([mockOrganization]),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockOrganization], 1]),
    })),
  };

  // Mock AuthGuard to inject fake user
  class MockAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest();
      req.user = {
        userId: 'test-user',
        organizationId: mockOrganization.organizationId,
        role: 'ADMIN',
      };
      return true;
    }
  }

  // Mock RolesGuard to always allow
  class MockRolesGuard implements CanActivate {
    canActivate(): boolean {
      return true;
    }
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrganizationsModule],
    })
      .overrideProvider(getRepositoryToken(Organization))
      .useValue(mockRepository)
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    repository = moduleFixture.get<Repository<Organization>>(getRepositoryToken(Organization));
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/POST organizations', () => {
    it('should create a new organization', async () => {
      return request(app.getHttpServer())
        .post('/organizations')
        .send({
          name: 'Test Org',
          gstin: '12ABCDE1234F1Z5',
          pan: 'ABCDE1234F',
          type: OrganizationType.PROPRIETORSHIP,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            organizationId: mockOrganization.organizationId,
            workspaceId: mockOrganization.workspaceId,
            name: 'Test Org',
            type: OrganizationType.PROPRIETORSHIP,
          });
        });
    });

    it('should throw conflict if GSTIN already exists', async () => {
      mockRepository.save.mockRejectedValueOnce({
        code: '23505',
        constraint: 'organizations_gstin_key',
      });

      return request(app.getHttpServer())
        .post('/organizations')
        .send({
          name: 'Duplicate Org',
          gstin: mockOrganization.gstin,
          pan: 'ZZZDE1234F',
          type: OrganizationType.PROPRIETORSHIP,
        })
        .expect(409);
    });

    it('should throw conflict if PAN already exists', async () => {
      mockRepository.save.mockRejectedValueOnce({
        code: '23505',
        constraint: 'organizations_pan_key',
      });

      return request(app.getHttpServer())
        .post('/organizations')
        .send({
          name: 'Duplicate PAN Org',
          gstin: '22ABCDE1234F1Z9',
          pan: mockOrganization.pan,
          type: OrganizationType.PROPRIETORSHIP,
        })
        .expect(409);
    });
  });

  describe('/GET organizations', () => {
    it('should return a list of organizations with meta', async () => {
      return request(app.getHttpServer())
        .get('/organizations?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
          expect(res.body.meta.total).toBe(1);
        });
    });
  });

  describe('/GET organizations/:orgId', () => {
    it('should return an organization if found', async () => {
      return request(app.getHttpServer())
        .get(`/organizations/${mockOrganization.organizationId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            organizationId: mockOrganization.organizationId,
            name: 'Test Org',
          });
        });
    });

    it('should return 404 if organization not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .get('/organizations/non-existent-id')
        .expect(404);
    });
  });

  describe('/PATCH organizations/:orgId', () => {
    it('should update an organization', async () => {
      mockRepository.save.mockResolvedValueOnce({
        ...mockOrganization,
        name: 'Updated Org',
      });

      return request(app.getHttpServer())
        .patch(`/organizations/${mockOrganization.organizationId}`)
        .send({ name: 'Updated Org' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            organizationId: mockOrganization.organizationId,
            name: 'Updated Org',
          });
        });
    });

    it('should return 404 if organization not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .patch('/organizations/non-existent-id')
        .send({ name: 'Updated Org' })
        .expect(404);
    });
  });

  describe('/DELETE organizations/:orgId', () => {
    it('should delete an organization', async () => {
      return request(app.getHttpServer())
        .delete(`/organizations/${mockOrganization.organizationId}`)
        .expect(200);
    });

    it('should return 404 if organization not found', async () => {
      mockRepository.delete.mockResolvedValueOnce({ affected: 0 });

      return request(app.getHttpServer())
        .delete('/organizations/non-existent-id')
        .expect(404);
    });
  });
});
