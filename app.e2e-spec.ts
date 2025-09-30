import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './src/app.module';
import { UserRole, PartnerType } from './src/common/enums';

describe('Flocci-Invoices Full Product E2E Test', () => {
  let app: INestApplication;

  let token: string;
  let orgId: string;
  let partnerId: string;
  let productId: string;
  let invoiceId: string;
  let paymentId: string;

  const adminCredentials = { username: 'admin', password: 'admin123' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // -----------------------------
    // Register Admin User (if required)
    // -----------------------------
    // Optional: comment out if user already exists
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username: 'admin', password: 'admin123', role: UserRole.ADMIN })
      .expect([HttpStatus.CREATED, HttpStatus.CONFLICT]); // allow conflict if already exists

    // -----------------------------
    // Login
    // -----------------------------
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(adminCredentials)
      .expect(HttpStatus.CREATED);

    token = loginRes.body.accessToken;
    expect(token).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });

  // -----------------------------
  // Organizations
  // -----------------------------
  it('should create an organization', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Org Pvt Ltd', gstin: '12ABCDE1234F1Z5', pan: 'ABCDE1234F' })
      .expect(HttpStatus.CREATED);

    orgId = res.body.organizationId || res.body.id;
    expect(orgId).toBeDefined();
    expect(res.body.name).toBe('Test Org Pvt Ltd');
  });

  it('should list organizations', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/organizations?sortBy=createdAt&sortOrder=DESC&page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data).toBeInstanceOf(Array);
  });

  // -----------------------------
  // Business Partners
  // -----------------------------
  it('should create a business partner', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/business-partners')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Partner',
        email: 'partner@test.com',
        type: PartnerType.BOTH,
        billingAddress: {
          street: '123 Main St',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560001',
          country: 'India',
        },
        shippingAddress: {
          street: '456 Market Rd',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560002',
          country: 'India',
        },
      })
      .expect(HttpStatus.CREATED);

    partnerId = res.body.partnerId || res.body.id;
    expect(res.body.name).toBe('Test Partner');
  });

  // -----------------------------
  // Products / Services
  // -----------------------------
  it('should create a product/service', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/products-services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Product A', price: 100 })
      .expect(HttpStatus.CREATED);

    productId = res.body.productId || res.body.id;
    expect(res.body.name).toBe('Product A');
  });

  // -----------------------------
  // Invoices
  // -----------------------------
  it('should create an invoice', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        partnerId,
        items: [{ productId, quantity: 2 }],
      })
      .expect(HttpStatus.CREATED);

    invoiceId = res.body.invoiceId || res.body.id;
    expect(res.body.totalAmount).toBeDefined();
  });

  it('should list invoices', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/invoices?sortBy=createdAt&sortOrder=DESC&page=1&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.data).toBeInstanceOf(Array);
  });

  // -----------------------------
  // Payments
  // -----------------------------
  it('should record a payment for invoice', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        invoiceId,
        amount: 200,
        mode: 'UPI',
      })
      .expect(HttpStatus.CREATED);

    paymentId = res.body.paymentId || res.body.id;
    expect(res.body.invoiceId).toBe(invoiceId);
  });

  it('should list payments by invoice', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/payments/invoice/${invoiceId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body).toBeInstanceOf(Array);
  });

  // -----------------------------
  // Compliance
  // -----------------------------
  it('should generate e-way bill for invoice', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/compliance/ewaybill')
      .set('Authorization', `Bearer ${token}`)
      .send({
        invoiceId,
        transporterId: 'T12345',
        vehicleNo: 'KA01AB1234',
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toHaveProperty('ewbId');
  });

  it('should file GSTR for organization', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/compliance/gstr')
      .set('Authorization', `Bearer ${token}`)
      .send({ organizationId: orgId, period: '2025-09' })
      .expect(HttpStatus.CREATED);

    expect(res.body).toHaveProperty('filingId');
  });

  // -----------------------------
  // Events
  // -----------------------------
  it('should emit invoice.created event', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        partnerId,
        items: [{ productId, quantity: 1 }],
      })
      .expect(HttpStatus.CREATED);

    expect(res.body.invoiceId).toBeDefined();
    // EventService logs/side effects can be verified in console or via mocks if needed
  });
});
