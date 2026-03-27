# Invoices Service

## Creator

This project was created, written, and maintained by **Anish Kumar**.
All primary documentation in this README is presented as the work of **Anish Kumar**.

A production-ready, multi-tenant invoicing service built with NestJS, TypeScript, and PostgreSQL. This service handles financial transactions with full GST compliance for Indian businesses.

## Ã°Å¸Å¡â‚¬ Features

- **Multi-tenant Architecture**: Complete isolation between organizations
- **GST Compliance**: Built-in support for Indian GST regulations
- **E-invoicing Ready**: IRN generation and QR code support
- **E-Way Bill Integration**: Mock integration with NIC APIs
- **GSTR Filing**: Automated GSTR-1 and GSTR-3B generation
- **Role-based Access Control**: Fine-grained permissions system
- **Event-driven Architecture**: RabbitMQ integration for real-time events
- **Production Ready**: Docker containerization, logging, monitoring

## Ã°Å¸â€ºÂ  Tech Stack

- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT-based stateless authentication
- **Message Queue**: RabbitMQ
- **Caching**: Redis (optional)
- **Documentation**: OpenAPI/Swagger
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest
- **Logging**: Winston

## Ã°Å¸â€œâ€¹ Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 15+
- RabbitMQ 3.8+

## Ã°Å¸Å¡â‚¬ Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd invoices-srv
cp .env.example .env
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start with Docker Compose

```bash
# Development environment
docker-compose up -d

# Or production environment
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Run Database Migrations

```bash
npm run migration:run
```

### 5. Start the Application

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

The API will be available at:
- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/v1/docs
- **Health**: http://localhost:3000/api/v1/health
- **RabbitMQ Management**: http://localhost:15672 (invoices/change_me)

## Ã°Å¸â€œÂ Project Structure

```
src/
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ common/                 # Shared utilities
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ decorators/        # Custom decorators
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ enums/             # TypeScript enums
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ filters/           # Exception filters
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ guards/            # Authentication guards
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ interfaces/        # TypeScript interfaces
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ config/                # Configuration files
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ core/                  # Core module setup
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ entities/              # TypeORM entities
Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ modules/               # Feature modules
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ organizations/     # Organization management
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ business-partners/ # Customer/vendor management
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ products-services/ # Product catalog
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ invoices/         # Invoice management
    Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ payments/         # Payment processing
    Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ compliance/       # GST compliance
```

## Ã°Å¸â€Â Authentication

The service is fully standalone and does not require any parent platform for authentication.

Use the built-in auth flow:
- `POST /auth/register` to create a user
- `POST /auth/login` to receive a JWT
- `POST /auth/refresh` to rotate an access token with a refresh token
- `POST /auth/password-reset/request` to start a reset flow
- `POST /auth/password-reset/confirm` to set a new password with a valid reset token
- use the JWT in protected routes with `Authorization: Bearer <jwt_token>`
- standalone registrations default to `admin` so the service is usable immediately

JWT payload structure:

```json
{
  "userId": "uuid",
  "workspaceId": "uuid",
  "roles": ["admin", "finance_manager", "sales", "viewer"],
  "organizationId": "uuid"
}
```

### Authorization Header
```
Authorization: Bearer <jwt_token>
```

### Self-Service Onboarding
1. Register with email and password.
2. If no organization ID is provided, one is created automatically.
3. Save the returned JWT.
4. Use that token across organization-scoped endpoints.

### Token lifecycle
- Login and registration now return both `access_token` and `refresh_token`
- Refresh tokens are signed independently so clients can rotate access safely
- Password reset is stateless and works without Redis or a third-party auth provider
- In production, set `PASSWORD_RESET_EXPOSE_TOKEN=false` and deliver reset links through your own email/SMS layer

## Ã°Å¸â€œÅ  Database Schema

The service implements the complete SQL schema with:

- **Organizations**: Multi-tenant organization management
- **Users**: Role-based access control within organizations
- **Business Partners**: Customer and vendor management
- **Products/Services**: Catalog with HSN/SAC codes
- **Invoices**: Full invoice lifecycle management
- **Payments**: Payment tracking and reconciliation
- **Compliance**: E-Way Bills and GSTR filings

## Ã°Å¸â€Å’ API Endpoints

### Auth
- `POST /auth/register` - Register a user and auto-provision an organization if needed
- `POST /auth/login` - Log in and receive a JWT
- `POST /auth/refresh` - Exchange a valid refresh token for a fresh token pair
- `POST /auth/password-reset/request` - Create a reset token for a user
- `POST /auth/password-reset/confirm` - Set a new password using a reset token
- `GET /api/v1/health` - Public health check

### Organizations
- `POST /organizations` - Create organization
- `GET /organizations/:orgId` - Get organization details
- `PATCH /organizations/:orgId` - Update organization

### Business Partners
- `POST /organizations/:orgId/partners` - Create partner
- `GET /organizations/:orgId/partners` - List partners (with pagination)
- `GET /organizations/:orgId/partners/:partnerId` - Get partner
- `PATCH /organizations/:orgId/partners/:partnerId` - Update partner

### Invoices
- `POST /organizations/:orgId/invoices` - Create invoice
- `GET /organizations/:orgId/invoices` - List invoices (with filtering)
- `GET /organizations/:orgId/invoices/:invoiceId` - Get invoice
- `PATCH /organizations/:orgId/invoices/:invoiceId` - Update invoice
- `POST /organizations/:orgId/invoices/:invoiceId/send` - Send invoice
- `DELETE /organizations/:orgId/invoices/:invoiceId` - Void invoice

### Payments
- `POST /organizations/:orgId/invoices/:invoiceId/payments` - Record payment

### Compliance
- `POST /organizations/:orgId/invoices/:invoiceId/ewaybill` - Generate E-Way Bill
- `POST /organizations/:orgId/gstr/generate` - Generate GSTR filing

## Ã°Å¸Å½Â¯ Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **admin** | Full access to all operations |
| **finance_manager** | Invoice, payment, compliance operations |
| **sales** | Create/update invoices, view reports |
| **viewer** | Read-only access |

## Ã°Å¸â€œÂ¨ Event Publishing

The service publishes events for integration with other services:

```typescript
// Invoice events
'invoices.invoice.created'
'invoices.invoice.sent'
'invoices.invoice.paid'

// Payment events  
'invoices.payment.received'
'invoices.payment.failed'
```

## Ã°Å¸Â§Âª Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Ã°Å¸â€œË† Monitoring & Logging

- **Structured Logging**: JSON format with Winston
- **Health Checks**: Built-in health check endpoint
- **Metrics**: Request/response logging with correlation IDs
- **Error Tracking**: Global exception filter with detailed error responses

## Ã°Å¸Å¡â‚¬ Deployment

### Production Environment Variables

```bash
NODE_ENV=production
DATABASE_HOST=<production-db-host>
DATABASE_SSL=true
JWT_SECRET=<strong-production-secret>
LOG_LEVEL=warn
```

Important:
- the service now validates critical environment variables at startup
- `JWT_SECRET` is required in all modes
- `JWT_REFRESH_SECRET` and `PASSWORD_RESET_SECRET` are required in production
- database connection values are required in production
- the service does not depend on an external platform to authenticate users
- set `CORS_ORIGIN` to the client or integration origin you want to allow
- auth endpoints now have built-in in-memory rate limiting to reduce brute-force abuse

### Docker Production Build

```bash
docker build -t invoices-srv .
docker run -p 3000:3000 --env-file .env.production invoices-srv
```

## Ã°Å¸Â¤Â Contributing

1. Follow the existing code style (ESLint/Prettier configured)
2. Write tests for new features
3. Update documentation for API changes
4. Use conventional commit messages

## Ã°Å¸â€œâ€ž License

This project is private. All rights reserved.

## Ã°Å¸â€ Ëœ Support

For issues or questions:
- Create an issue in the repository
- Contact the project maintainer
- Check the API documentation at `/api/v1/docs`