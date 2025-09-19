import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  Unique,
  Index,
} from 'typeorm';
import { InvoiceStatus } from '../common/enums';
import { Organization } from './organization.entity';
import { BusinessPartner } from './business-partner.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Payment } from './payment.entity';
import { EwayBill } from './eway-bill.entity';

@Entity('invoices')
@Unique(['organizationId', 'invoiceNumber'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  invoiceId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('uuid')
  @Index()
  partnerId: string;

  @Column({ length: 50 })
  invoiceNumber: string;

  @Column('date')
  issueDate: Date;

  @Column('date')
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  @Index()
  status: InvoiceStatus;

  @Column('decimal', { precision: 15, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalTax: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0.00 })
  amountPaid: number;

  @Column({ length: 64, nullable: true })
  irn: string; // Invoice Reference Number for e-invoicing

  @Column('text', { nullable: true })
  qrCodeUrl: string; // URL to the signed QR code image

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  terms: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.invoices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => BusinessPartner, (partner) => partner.invoices)
  @JoinColumn({ name: 'partnerId' })
  partner: BusinessPartner;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @OneToOne(() => EwayBill, (ewayBill) => ewayBill.invoice)
  ewayBill: EwayBill;
}
