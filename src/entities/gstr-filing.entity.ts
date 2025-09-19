import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GstrFilingType, GstrFilingStatus } from '../common/enums';
import { Organization } from './organization.entity';

@Entity('gstr_filings')
export class GstrFiling {
  @PrimaryGeneratedColumn('uuid')
  filingId: string;

  @Column('uuid')
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
  status: GstrFilingStatus;

  @Column('jsonb', { nullable: true })
  payload: any; // The generated JSON for upload

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
