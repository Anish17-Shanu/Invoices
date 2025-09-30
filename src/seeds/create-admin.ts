import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export const createAdmin = async (dataSource: DataSource) => {
  const userRepo = dataSource.getRepository(User);

  const adminExists = await userRepo.findOne({
    where: { email: 'admin@example.com' },
  });

  if (adminExists) return;

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const adminUser = userRepo.create({
    userId: uuidv4(), // generate a UUID
    email: 'admin@example.com',
    password: passwordHash,
    organizationId: 'org-uuid', // replace with your org ID
    role: UserRole.ADMIN, // matches enum type
  });

  await userRepo.save(adminUser);
  console.log('Admin user created!');
};
