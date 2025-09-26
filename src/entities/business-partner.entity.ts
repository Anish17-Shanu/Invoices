import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { PartnerType } from '../common/enums';
import { Organization } from './organization.entity';
import { Invoice } from './invoice.entity';
import { Address } from './organization.entity';

@Entity('business_partners')
@Unique(['organizationId', 'name']) // Prevent duplicate names inside an org
export class BusinessPartner {
  @PrimaryGeneratedColumn('uuid')
  partnerId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: PartnerType,
  })
  @Index()
  type: PartnerType;

  @Column({ length: 15, nullable: true })
  gstin: string;

  @Column({ length: 10, nullable: true })
  pan: string;

  @Column('jsonb', { nullable: true, default: {} })
  billingAddress: Address;

  @Column('jsonb', { nullable: true, default: {} })
  shippingAddress: Address;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.businessPartners, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => Invoice, (invoice) => invoice.partner)
  invoices: Invoice[];
}
