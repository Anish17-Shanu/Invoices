# Flocci Invoices Microservice

A production-ready, multi-tenant invoicing microservice built with NestJS, TypeScript, and PostgreSQL. This service handles all financial transactions in the Flocci ecosystem with full GST compliance for Indian businesses.

## 🚀 Features

- **Multi-tenant Architecture**: Complete isolation between organizations
- **GST Compliance**: Built-in support for Indian GST regulations
- **E-invoicing Ready**: IRN generation and QR code support
- **E-Way Bill Integration**: Mock integration with NIC APIs
- **GSTR Filing**: Automated GSTR-1 and GSTR-3B generation
- **Role-based Access Control**: Fine-grained permissions system
- **Event-driven Architecture**: RabbitMQ integration for real-time events
- **Production Ready**: Docker containerization, logging, monitoring

## 🛠 Tech Stack

- **Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT-based stateless authentication
- **Message Queue**: RabbitMQ
- **Caching**: Redis (optional)
- **Documentation**: OpenAPI/Swagger
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest
- **Logging**: Winston

## 📋 Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 15+
- RabbitMQ 3.8+

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd flocci-invoices-srv
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
- **RabbitMQ Management**: http://localhost:15672 (flocci/flocci_password)

## 📁 Project Structure

```
src/
├── common/                 # Shared utilities
│   ├── decorators/        # Custom decorators
│   ├── enums/             # TypeScript enums
│   ├── filters/           # Exception filters
│   ├── guards/            # Authentication guards
│   └── interfaces/        # TypeScript interfaces
├── config/                # Configuration files
├── core/                  # Core module setup
├── entities/              # TypeORM entities
└── modules/               # Feature modules
    ├── organizations/     # Organization management
    ├── business-partners/ # Customer/vendor management
    ├── products-services/ # Product catalog
    ├── invoices/         # Invoice management
    ├── payments/         # Payment processing
    └── compliance/       # GST compliance
```

## 🔐 Authentication

The service expects JWT tokens from the Flocci OS Gateway with this payload structure:

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

## 📊 Database Schema

The service implements the complete SQL schema with:

- **Organizations**: Multi-tenant organization management
- **Users**: Role-based access control within organizations
- **Business Partners**: Customer and vendor management
- **Products/Services**: Catalog with HSN/SAC codes
- **Invoices**: Full invoice lifecycle management
- **Payments**: Payment tracking and reconciliation
- **Compliance**: E-Way Bills and GSTR filings

## 🔌 API Endpoints

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

## 🎯 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **admin** | Full access to all operations |
| **finance_manager** | Invoice, payment, compliance operations |
| **sales** | Create/update invoices, view reports |
| **viewer** | Read-only access |

## 📨 Event Publishing

The service publishes events for integration with other Flocci services:

```typescript
// Invoice events
'flocci.invoices.invoice.created'
'flocci.invoices.invoice.sent'
'flocci.invoices.invoice.paid'

// Payment events  
'flocci.invoices.payment.received'
'flocci.invoices.payment.failed'
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📈 Monitoring & Logging

- **Structured Logging**: JSON format with Winston
- **Health Checks**: Built-in health check endpoint
- **Metrics**: Request/response logging with correlation IDs
- **Error Tracking**: Global exception filter with detailed error responses

## 🚀 Deployment

### Production Environment Variables

```bash
NODE_ENV=production
DATABASE_HOST=<production-db-host>
DATABASE_SSL=true
JWT_SECRET=<strong-production-secret>
LOG_LEVEL=warn
```

### Docker Production Build

```bash
docker build -t flocci-invoices-srv .
docker run -p 3000:3000 --env-file .env.production flocci-invoices-srv
```

## 🤝 Contributing

1. Follow the existing code style (ESLint/Prettier configured)
2. Write tests for new features
3. Update documentation for API changes
4. Use conventional commit messages

## 📄 License

This project is proprietary to Flocci. All rights reserved.

## 🆘 Support

For issues or questions:
- Create an issue in the repository
- Contact the Flocci development team
- Check the API documentation at `/api/v1/docs`
