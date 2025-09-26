import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { PaymentMode } from '../common/enums';
import { Invoice } from './invoice.entity';
import { Organization } from './organization.entity';

@Entity('payments')
@Unique(['organizationId', 'transactionId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  paymentId: string;

  @Column('uuid')
  @Index()
  invoiceId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  amount: number;

  @Column('date')
  paymentDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentMode,
  })
  mode: PaymentMode;

  @Column({ length: 100, nullable: true })
  transactionId: string;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Invoice, (invoice) => invoice.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @ManyToOne(() => Organization, (organization) => organization.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;
}
