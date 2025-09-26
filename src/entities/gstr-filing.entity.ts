import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { GstrFilingType, GstrFilingStatus } from '../common/enums';
import { Organization } from './organization.entity';

@Entity('gstr_filings')
@Unique(['organizationId', 'type', 'period'])
export class GstrFiling {
  @PrimaryGeneratedColumn('uuid')
  filingId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column({
    type: 'enum',
    enum: GstrFilingType,
  })
  type: GstrFilingType;

  @Column({ length: 7 }) // Format: 'YYYY-MM'
  period: string;

  @Column({
    type: 'enum',
    enum: GstrFilingStatus,
    default: GstrFilingStatus.PENDING,
  })
  @Index()
  status: GstrFilingStatus;

  @Column('jsonb', { nullable: true })
  payload: Record<string, any>; // Generated JSON for upload

  @Column('timestamptz', { nullable: true })
  filedAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.gstrFilings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;
}
export { GstrFilingStatus };

