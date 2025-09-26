import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrganizationType } from '../common/enums';
import { User } from './user.entity';
import { BusinessPartner } from './business-partner.entity';
import { ProductService } from './product-service.entity';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';
import { GstrFiling } from './gstr-filing.entity';

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  organizationId: string;

  @Column('uuid', { nullable: true, unique: true })
  @Index()
  workspaceId: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  legalName: string;

  @Column({
    type: 'enum',
    enum: OrganizationType,
    nullable: true,
  })
  type: OrganizationType;

  @Column({ length: 15, unique: true })
  gstin: string;

  @Column({ length: 10, unique: true })
  pan: string;

  @Column('jsonb', { nullable: true, default: {} })
  address: Address;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // Relationships
  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => BusinessPartner, (partner) => partner.organization)
  businessPartners: BusinessPartner[];

  @OneToMany(() => ProductService, (product) => product.organization)
  productsServices: ProductService[];

  @OneToMany(() => Invoice, (invoice) => invoice.organization)
  invoices: Invoice[];

  @OneToMany(() => Payment, (payment) => payment.organization)
  payments: Payment[];

  @OneToMany(() => GstrFiling, (filing) => filing.organization)
  gstrFilings: GstrFiling[];
}

