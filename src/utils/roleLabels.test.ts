import { toRoleBadges, toRoleLabel } from './roleLabels';

describe('toRoleLabel', () => {
  it('title-cases snake_case roles', () => {
    expect(toRoleLabel('middle_admin')).toBe('Middle Admin');
  });

  it('returns an empty string for a missing role', () => {
    expect(toRoleLabel(null)).toBe('');
    expect(toRoleLabel(undefined)).toBe('');
  });
});

describe('toRoleBadges', () => {
  it('wraps the label in a single-item list', () => {
    expect(toRoleBadges('data_admin')).toEqual(['Data Admin']);
  });

  it('returns no badges for a missing role', () => {
    expect(toRoleBadges('')).toEqual([]);
  });
});
