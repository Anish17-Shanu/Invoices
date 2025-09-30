import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Organizations & Super Admin Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let superAdminToken: string;
  let adminToken: string;
  let orgId: string;

  const superAdmin = {
    email: 'superadmin@test.com',
    password: 'admin123',
    firstName: 'Super',
    lastName: 'Admin',
  };

  const adminUser = {
    email: 'admin@test.com',
    password: 'admin123',
    firstName: 'Org',
    lastName: 'Admin',
  };

  const orgData = {
    name: 'Test Org',
    pan: 'ABCDE1234F',
    gstin: '12ABCDE1234F1Z5',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);

    // Clean database tables in proper order
    await dataSource.query('TRUNCATE TABLE "user" CASCADE;');
    await dataSource.query('TRUNCATE TABLE "organization" CASCADE;');
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a superadmin user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register-superadmin')
      .send(superAdmin);

    expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(res.status);
  });

  it('should login superadmin and get JWT token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: superAdmin.email, password: superAdmin.password })
      .expect(HttpStatus.OK);

    expect(res.body.access_token).toBeDefined();
    superAdminToken = res.body.access_token;
  });

  it('should create an organization using superadmin token', async () => {
    const res = await request(app.getHttpServer())
      .post('/organizations')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(orgData);

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body.data.organizationId).toBeDefined();
    orgId = res.body.data.organizationId;
  });

  it('should create an admin user for the organization', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register-admin')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ ...adminUser, organizationId: orgId });

    expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(res.status);
  });

  it('should login admin and get JWT token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: adminUser.password })
      .expect(HttpStatus.OK);

    expect(res.body.access_token).toBeDefined();
    adminToken = res.body.access_token;
  });

  it('should get the organization details using admin token', async () => {
    const res = await request(app.getHttpServer())
      .get(`/organizations/${orgId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(HttpStatus.OK);

    expect(res.body.data.organizationId).toBe(orgId);
    expect(res.body.data.name).toBe(orgData.name);
  });
});
