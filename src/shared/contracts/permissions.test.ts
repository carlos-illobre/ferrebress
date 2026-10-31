import { describe, expect, it } from 'vitest';
import { can, permissionsHash } from './can.ts';
import { isPermission, permissions, withIncluded } from './permissions.ts';

describe('los permisos (02 · R7.1)', () => {
  it('cada uno tiene su parte, su nombre y su explicación, y lo que incluye existe', () => {
    const ids = permissions.map((one) => one.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const one of permissions) {
      expect(one.name.length).toBeGreaterThan(0);
      expect(one.explanation.length).toBeGreaterThan(0);
      for (const included of one.includes) expect(ids).toContain(included);
    }
  });

  it('administrar personas, cortar y administrar roles incluyen ver a las personas', () => {
    expect(withIncluded(['users.cut'])).toEqual(['users.cut', 'users.view']);
    expect(withIncluded(['roles.manage', 'users.manage'])).toEqual([
      'roles.manage',
      'users.manage',
      'users.view',
    ]);
    expect(withIncluded(['offline.work'])).toEqual(['offline.work']);
  });

  it('reconoce los ids de la lista y nada más', () => {
    expect(isPermission('users.view')).toBe(true);
    expect(isPermission('users.delete')).toBe(false);
    expect(isPermission(3)).toBe(false);
  });

  it('can: la persona tiene el permiso; sin persona, no', () => {
    expect(can({ permissions: ['users.view'] }, 'users.view')).toBe(true);
    expect(can({ permissions: ['users.view'] }, 'roles.manage')).toBe(false);
    expect(can(undefined, 'users.view')).toBe(false);
  });

  it('la huella no depende del orden y cambia con lo que cambia', () => {
    const one = permissionsHash(['users.view', 'roles.manage']);
    expect(one).toMatch(/^[0-9a-f]{8}$/);
    expect(permissionsHash(['roles.manage', 'users.view'])).toBe(one);
    expect(permissionsHash(['users.view'])).not.toBe(one);
    expect(permissionsHash([])).toMatch(/^[0-9a-f]{8}$/);
  });
});
