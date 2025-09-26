import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';

export interface VehicleDetails {
  vehicleNumber: string;
  transporterId: string;
  transporterDocNo: string;
  transporterDocDate: Date;
  transportMode: string;
}

@Entity('eway_bills')
export class EwayBill {
  @PrimaryGeneratedColumn('uuid')
  ewbId: string;

  @Column('uuid', { unique: true })
  @Index()
  invoiceId: string;

  @Column({ length: 50, unique: true })
  @Index()
  ewbNumber: string;

  @Column('timestamptz')
  validFrom: Date;

  @Column('timestamptz')
  validUntil: Date;

  @Column('jsonb', { nullable: true, default: {} })
  vehicleDetails: VehicleDetails;

  @Column({ length: 20, nullable: true })
  status: string; // e.g., "active", "expired", "cancelled"

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relationships
  @OneToOne(() => Invoice, (invoice) => invoice.ewayBill, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;
}
