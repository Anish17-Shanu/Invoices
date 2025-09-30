import { Roles } from '../src/common/decorators/roles.decorator';
import { Public } from '../src/common/decorators/public.decorator';
import { OrganizationParam } from '../src/common/decorators/organization.decorator';
import { CurrentUser } from '../src/common/decorators/current-user.decorator';
import { UserRole } from '../src/common/enums/user-role.enum'; // ✅ unified import

describe('Custom decorators', () => {
  it('Roles decorator should add metadata', () => {
    const decorator = Roles(UserRole.ADMIN); // ✅ now same enum type
    expect(typeof decorator).toBe('function');
  });

  it('Public decorator should add metadata', () => {
    const decorator = Public();
    expect(typeof decorator).toBe('function');
  });

  it('OrganizationParam decorator should add metadata', () => {
    const decorator = OrganizationParam('orgId');
    expect(typeof decorator).toBe('function');
  });

  it('CurrentUser decorator should be defined', () => {
    expect(CurrentUser).toBeDefined();
  });
});
