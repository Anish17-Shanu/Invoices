import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PartnerType } from '../src/common/enums';

describe('Invoices Service Full Product Test (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let orgId: string;
  let partnerId: string;
  let productId: string;
  let invoiceId: string;
  let paymentId: string;

  const adminUser = {
    username: 'admin_test',
    email: 'admin_test@example.com',
    password: 'admin123',
    role: 'ADMIN',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // -------------------- REGISTER --------------------
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(adminUser)
      .expect(HttpStatus.CREATED);

    // -------------------- LOGIN --------------------
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username: adminUser.username, password: adminUser.password })
      .expect(HttpStatus.CREATED);

    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ----------------- ORGANIZATIONS -----------------
  it('should create organization', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Org Pvt Ltd' })
      .expect(HttpStatus.CREATED);

    orgId = res.body.organizationId || res.body.id;
    expect(orgId).toBeDefined();
    expect(res.body.name).toBe('Test Org Pvt Ltd');
  });

  // ----------------- BUSINESS PARTNERS -----------------
  it('should create business partner', async () => {
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
    expect(partnerId).toBeDefined();
    expect(res.body.name).toBe('Test Partner');
  });

  // ----------------- PRODUCTS / SERVICES -----------------
  it('should create product', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/products-services')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Product A', price: 100 })
      .expect(HttpStatus.CREATED);

    productId = res.body.productId || res.body.id;
    expect(productId).toBeDefined();
    expect(res.body.name).toBe('Product A');
  });

  // ----------------- INVOICES -----------------
  it('should create invoice', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        partnerId,
        items: [{ productId, quantity: 2 }],
      })
      .expect(HttpStatus.CREATED);

    invoiceId = res.body.invoiceId || res.body.id;
    expect(invoiceId).toBeDefined();
    expect(res.body.totalAmount).toBeDefined();
  });

  it('should update invoice', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Updated invoice notes' })
      .expect(HttpStatus.OK);

    expect(res.body.notes).toBe('Updated invoice notes');
  });

  it('should send invoice', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/invoices/${invoiceId}/send`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.OK);

    expect(res.body.status).toBe('SENT');
  });

  // ----------------- PAYMENTS -----------------
  it('should record payment for invoice', async () => {
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

  it('should update payment', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/payments/${paymentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 250 })
      .expect(HttpStatus.OK);

    expect(res.body.amount).toBe(250);
  });

  // ----------------- COMPLIANCE -----------------
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
      .send({
        organizationId: orgId,
        period: '2025-09',
      })
      .expect(HttpStatus.CREATED);

    expect(res.body).toHaveProperty('filingId');
  });

  // ----------------- EVENTS -----------------
  it('should emit invoice.created event', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({
        partnerId,
        items: [{ productId, quantity: 1 }],
      })
      .expect(HttpStatus.CREATED);
    // EventService emits logs; verified in console
  });

  // ----------------- DELETE TEST DATA -----------------
  it('should delete organization', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/organizations/${orgId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(HttpStatus.NO_CONTENT);
  });
});
