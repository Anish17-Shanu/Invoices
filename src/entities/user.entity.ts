// src/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { UserRole } from '../common/enums';
import { Organization } from './organization.entity';

@Entity('users')
@Unique(['email', 'organizationId']) // Ensure unique email per organization
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string;

  @Column('uuid')
  @Index()
  organizationId: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

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
