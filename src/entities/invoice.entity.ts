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
import { InvoiceStatus } from '../common/enums/invoice-status.enum';
import { Organization } from './organization.entity';
import { BusinessPartner } from './business-partner.entity';
import { User } from './user.entity';
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

  @Column('uuid')
  @Index()
  userId: string; // creator

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

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  subtotal: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalTax: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  amountPaid: number;

  @Column({ length: 64, nullable: true })
  irn: string;

  @Column('text', { nullable: true })
  qrCodeUrl: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  terms: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, (org) => org.invoices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => BusinessPartner, (partner) => partner.invoices)
  @JoinColumn({ name: 'partnerId' })
  partner: BusinessPartner;

  @ManyToOne(() => User, (user) => user.invoices)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true, orphanedRowAction: 'delete' })
  items: InvoiceItem[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @OneToOne(() => EwayBill, (ewayBill) => ewayBill.invoice)
  ewayBill: EwayBill;
}
