// src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { userId } });
  }

  async createUser(registerDto: RegisterDto): Promise<User> {
    const user = this.userRepo.create(registerDto);
    return this.userRepo.save(user);
  }
}
