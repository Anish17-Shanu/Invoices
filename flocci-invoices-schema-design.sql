-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define custom ENUM types for data integrity
CREATE TYPE organization_type AS ENUM ('proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd');
CREATE TYPE user_role AS ENUM ('admin', 'finance_manager', 'sales', 'viewer');
CREATE TYPE partner_type AS ENUM ('customer', 'vendor');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'void');
CREATE TYPE payment_mode AS ENUM ('bank_transfer', 'upi', 'credit_card', 'debit_card', 'cash', 'cheque');
CREATE TYPE gstr_filing_type AS ENUM ('GSTR1', 'GSTR3B');
CREATE TYPE gstr_filing_status AS ENUM ('pending', 'filed', 'error');

-- Organizations Table (Replaces 'Company')
-- A legal entity within a Flocci Workspace
CREATE TABLE organizations (
    organization_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL, -- Foreign key to the central Flocci OS Workspaces table
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    gstin VARCHAR(15) UNIQUE NOT NULL,
    pan VARCHAR(10) UNIQUE NOT NULL,
    address JSONB, -- { street, city, state, postal_code, country }
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (Reference to Flocci OS Identity)
-- Stores user's role within a specific organization
CREATE TABLE users (
    user_id UUID PRIMARY KEY, -- This ID MUST match the Flocci OS User ID from JWT
    organization_id UUID REFERENCES organizations(organization_id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'viewer',
    UNIQUE(user_id, organization_id)
);

-- Business Partners (Customers & Vendors)
CREATE TABLE business_partners (
    partner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type partner_type NOT NULL,
    gstin VARCHAR(15),
    pan VARCHAR(10),
    billing_address JSONB,
    shipping_address JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products & Services Catalog
CREATE TABLE products_services (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hsn_sac_code VARCHAR(8),
    unit_price NUMERIC(15, 2) NOT NULL,
    gst_rate_percent NUMERIC(5, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(organization_id, name)
);

-- Invoices Table
CREATE TABLE invoices (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES business_partners(partner_id),
    invoice_number VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    subtotal NUMERIC(15, 2) NOT NULL,
    total_tax NUMERIC(15, 2) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    amount_paid NUMERIC(15, 2) DEFAULT 0.00,
    irn VARCHAR(64), -- Invoice Reference Number for e-invoicing
    qr_code_url TEXT, -- URL to the signed QR code image
    notes TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, invoice_number)
);

-- Invoice Line Items
CREATE TABLE invoice_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products_services(product_id),
    description TEXT NOT NULL, -- Snapshotted from product at time of creation
    hsn_sac_code VARCHAR(8),
    quantity NUMERIC(10, 2) NOT NULL,
    rate NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(15, 2) NOT NULL
);

-- Payments Received
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(invoice_id),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id),
    amount NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL,
    mode payment_mode NOT NULL,
    transaction_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E-Way Bills
CREATE TABLE eway_bills (
    ewb_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL UNIQUE REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    ewb_number VARCHAR(50) UNIQUE NOT NULL,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    vehicle_details JSONB,
    status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GSTR Filings
CREATE TABLE gstr_filings (
    filing_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(organization_id) ON DELETE CASCADE,
    type gstr_filing_type NOT NULL,
    period VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    status gstr_filing_status NOT NULL DEFAULT 'pending',
    payload JSONB, -- The generated JSON for upload
    filed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups on foreign keys and frequently queried columns
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_partner_id ON invoices(partner_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);