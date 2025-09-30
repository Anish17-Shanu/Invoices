import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PartnerType } from '../common/enums/partner-type.enum';
import { Organization } from './organization.entity';
import { User } from './user.entity';
import { Invoice } from './invoice.entity';

@Entity('business_partners')
@Unique(['organizationId', 'name'])
export class BusinessPartner {
  @PrimaryGeneratedColumn('uuid')
  partnerId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column('uuid')
  @Index()
  createdById: string; // creator user

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
  billingAddress: Record<string, any>;

  @Column('jsonb', { nullable: true, default: {} })
  shippingAddress: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Organization, (org) => org.businessPartners, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.businessPartners)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @OneToMany(() => Invoice, (invoice) => invoice.partner)
  invoices: Invoice[];
}
