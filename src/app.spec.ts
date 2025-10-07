import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';

describe('Organizations & Auth Flow (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let token: string;
  let orgId: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    dataSource = app.get(DataSource);
    await dataSource.synchronize(true); // reset DB schema for clean state
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  it('should create an organization (public route)', async () => {
    const res = await request(server)
      .post('/organizations')
      .send({
        name: 'Test Org',
        gstin: '12ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
      })
      .expect(HttpStatus.CREATED);

    console.log('Organization create response:', res.body);

    // ✅ match nested data path
    orgId =
      res.body?.data?.organizationId ||
      res.body?.organizationId ||
      res.body?.id ||
      res.body?.data?.id;

    expect(orgId).toBeDefined();
    console.log('✅ Organization created with ID:', orgId);
  });

  it('should register superadmin user', async () => {
    const res = await request(server)
      .post('/auth/register')
      .send({
        email: 'superadmin@test.com',
        password: 'admin123',
        role: 'SUPER_ADMIN',
        organizationId: orgId,
      });

    console.log('Superadmin registration response:', res.status, res.body);

    expect([HttpStatus.CREATED, HttpStatus.OK]).toContain(res.status);
    expect(res.body).toBeDefined();
  });

  it('should login and get JWT token', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({
        email: 'superadmin@test.com',
        password: 'admin123',
      });

    console.log('Login response:', res.status, res.body);

    expect(res.status).toBe(HttpStatus.OK);

    token =
      res.body?.data?.access_token ||
      res.body?.access_token ||
      res.body?.token;

    expect(token).toBeDefined();
    console.log('✅ JWT Token:', token);
  });

  it('should get the organization details (protected route)', async () => {
    const res = await request(server)
      .get(`/organizations/${orgId}`)
      .set('Authorization', `Bearer ${token}`);

    console.log('Org fetch response:', res.status, res.body);

    expect(res.status).toBe(HttpStatus.OK);

    // ✅ handle nested data key properly
    const fetchedOrgId =
      res.body?.data?.organizationId ||
      res.body?.organizationId ||
      res.body?.id;

    expect(fetchedOrgId).toBe(orgId);
  });
});
