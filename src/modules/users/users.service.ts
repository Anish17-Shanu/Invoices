// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/enums';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { userId } });
  }

  async createUser(data: {
    email: string;
    password: string;
    role?: UserRole;
    organizationId?: string;
  }): Promise<User> {
    // Auto-create org if not provided
    let orgId = data.organizationId;
    if (!orgId) {
      const org = await this.organizationsService.createDefaultOrgForUser(
        data.email,
      );
      orgId = org.organizationId;
    }

    const user = this.userRepo.create({
      email: data.email,
      password: data.password,
      role: data.role ?? UserRole.VIEWER,
      organizationId: orgId,
    });

    return this.userRepo.save(user);
  }
}
