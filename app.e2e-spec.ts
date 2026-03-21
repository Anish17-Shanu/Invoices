import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './src/app.module';
import { UserRole, PartnerType } from './src/common/enums';
import { DataSource } from 'typeorm';
import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';

describe('Invoices Service Full Product E2E Test', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;
  let orgId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a new organization', async () => {
    const res = await request(app.getHttpServer())
      .post('/org/register')
      .send({
        name: 'Test Organization',
        type: PartnerType.CUSTOMER,
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toBeDefined();
    expect(res.body).toHaveProperty('id');
    orgId = res.body.id;
  });

  it('should create a new user and login', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        username: 'admin',
        password: 'password123',
        role: UserRole.ADMIN,
        orgId,
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toBeDefined();
    expect(res.body).toHaveProperty('id');

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'password123',
      })
      .expect(HttpStatus.OK);

    expect(loginRes.body).toHaveProperty('access_token');
    token = loginRes.body.access_token;
  });

  it('should create a new invoice', async () => {
    const res = await request(app.getHttpServer())
      .post('/invoice')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orgId,
        amount: 5000,
        description: 'Test invoice for services rendered',
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toHaveProperty('id');
    expect(res.body.amount).toBe(5000);
  });

  it('should list all invoices', async () => {
    const res = await request(app.getHttpServer())
      .get(`/invoice?orgId=${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should make a payment for the invoice', async () => {
    const invoiceRes = await request(app.getHttpServer())
      .get(`/invoice?orgId=${orgId}`)
      .set('Authorization', `Bearer ${token}`);

    const invoiceId = invoiceRes.body[0].id;

    const paymentRes = await request(app.getHttpServer())
      .post('/payment')
      .set('Authorization', `Bearer ${token}`)
      .send({
        invoiceId,
        amount: 5000,
        method: 'BANK_TRANSFER',
      })
      .expect(HttpStatus.CREATED);

    expect(paymentRes.body).toHaveProperty('id');
    expect(paymentRes.body.amount).toBe(5000);
  });

  it('should fetch payment history', async () => {
    const res = await request(app.getHttpServer())
      .get(`/payment/history?orgId=${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('amount');
  });
});
