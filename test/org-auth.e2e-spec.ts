import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Organizations & Auth Flow (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let token: string;
  let orgId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    server = app.getHttpServer();
  });

  afterAll(async () => {
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

    expect(res.body.organizationId).toBeDefined();
    orgId = res.body.organizationId;
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

    // Accept CREATED or CONFLICT if user already exists
    expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(res.status);
  });

  it('should login and get JWT token', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send({ email: 'superadmin@test.com', password: 'admin123' })
      .expect(HttpStatus.OK);

    expect(res.body.access_token).toBeDefined();
    token = res.body.access_token;
  });

  it('should get the organization details (protected route)', async () => {
    const res = await request(server)
      .get(`/organizations/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.organizationId).toBe(orgId);
    expect(res.body.name).toBe('Test Org');
  });
});
