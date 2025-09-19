import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Unique,
  Index,
} from 'typeorm';
import { Organization } from './organization.entity';
import { InvoiceItem } from './invoice-item.entity';

@Entity('products_services')
@Unique(['organizationId', 'name'])
export class ProductService {
  @PrimaryGeneratedColumn('uuid')
  productId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 8, nullable: true })
  hsnSacCode: string;

  @Column('decimal', { precision: 15, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 5, scale: 2 })
  gstRatePercent: number;

  @Column({ default: true })
  isActive: boolean;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.productsServices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => InvoiceItem, (item) => item.product)
  invoiceItems: InvoiceItem[];
}
