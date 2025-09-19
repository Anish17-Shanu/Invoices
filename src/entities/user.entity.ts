import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserRole } from '../common/enums';
import { Organization } from './organization.entity';

@Entity('users')
@Unique(['userId', 'organizationId'])
export class User {
  @PrimaryColumn('uuid')
  userId: string; // Must match the Flocci OS User ID from JWT

  @Column('uuid')
  organizationId: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;
}
