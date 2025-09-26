import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums';
import * as bcrypt from 'bcrypt';

export const createAdmin = async (dataSource: DataSource) => {
  const userRepo = dataSource.getRepository(User);

  const adminExists = await userRepo.findOne({
    where: { email: 'admin@example.com' }, // Use email, not username
  });

  if (adminExists) return;

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const adminUser = userRepo.create({
    userId: 'some-uuid', // generate a UUID or use a library
    email: 'admin@example.com',
    password: 'Admin@123',
    organizationId: 'org-uuid', // replace with your org ID
    role: UserRole.ADMIN, // ✅ Correct enum usage
  });

  await userRepo.save(adminUser);
  console.log('Admin user created!');
};
