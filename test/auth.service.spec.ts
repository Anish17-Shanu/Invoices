// test/auth.service.spec.ts
import { AuthService } from '../src/modules/auth/auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService({} as any, {} as any); // mock deps
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error on invalid login', async () => {
    await expect(service.validateUser('wrong', 'wrong')).rejects.toThrow();
  });
});
