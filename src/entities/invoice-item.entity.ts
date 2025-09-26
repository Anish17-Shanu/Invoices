import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { ProductService } from './product-service.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  itemId: string;

  @Column('uuid')
  @Index()
  invoiceId: string;

  @Column('uuid', { nullable: true })
  @Index()
  productId: string;

  @Column('text')
  description: string; // Snapshotted from product at time of creation

  @Column({ length: 8, nullable: true })
  hsnSacCode: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  rate: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  taxAmount: number;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  lineTotal: number;

  // Relationships
  @ManyToOne(() => Invoice, (invoice) => invoice.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @ManyToOne(() => ProductService, (product) => product.invoiceItems, {
    nullable: true,
  })
  @JoinColumn({ name: 'productId' })
  product: ProductService;
}
