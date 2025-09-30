// test/entities.spec.ts
import { User } from '../src/entities/user.entity';

describe('Entities', () => {
  it('should create a User entity', () => {
    const user = new User();
    user.email = 'test@test.com';
    expect(user.email).toBe('test@test.com');
  });
});
