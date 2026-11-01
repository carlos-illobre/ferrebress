import type { RoleRow } from '@ferrebress/shared/contracts/roles';
import { describe, expect, it } from 'vitest';
import {
  duplicateOf,
  emptyDraft,
  fromRole,
  give,
  holdersOf,
  isDirty,
  reapply,
  take,
  tiedBy,
  toggle,
  toRequest,
  undo,
  validate,
} from './draft.ts';

const role = (over: Partial<RoleRow> = {}): RoleRow => ({
  id: 'r1',
  name: 'Encargado',
  description: 'Abre y cierra',
  system: false,
  version: 3,
  permissions: ['users.cut', 'users.view'],
  ...over,
});
const admin = role({
  id: 'admin',
  name: 'Administrador',
  system: true,
  permissions: ['offline.work', 'roles.manage', 'users.cut', 'users.manage', 'users.view'],
});
const context = (roleIdsOf: Record<string, string[]> = { yo: ['admin'], ana: ['r1'] }) => ({
  roles: [role(), admin],
  me: 'yo',
  roleIdsOf,
});

describe('el borrador de un rol (02 · R7.13)', () => {
  it('sale de un rol, sin cambios: «Guardar rol» apagado', () => {
    const draft = fromRole(role(), ['ana']);
    expect(isDirty(draft)).toBe(false);
    expect(holdersOf(draft)).toEqual(['ana']);
    expect(toRequest(draft)).toEqual({ version: 3 });
  });

  it('users-E36: tildar suma lo incluido; lo incluido no se destilda mientras esté el otro', () => {
    let draft = toggle(emptyDraft(), 'users.manage');
    expect(draft.permissions).toEqual(['users.manage', 'users.view']);
    expect(tiedBy(draft, 'users.view')).toEqual(['users.manage']);
    draft = toggle(draft, 'users.view');
    expect(draft.permissions).toContain('users.view');
    draft = toggle(draft, 'users.manage');
    expect(draft.permissions).toEqual(['users.view']);
    expect(tiedBy(draft, 'users.view')).toEqual([]);
  });

  it('users-E62: dar, sacar y deshacer quedan en el borrador; el pedido lleva solo lo que cambió', () => {
    let draft = fromRole(role(), ['ana']);
    draft = give(draft, 'beto');
    draft = take(draft, 'ana');
    draft = { ...draft, description: 'Otra' };
    expect(isDirty(draft)).toBe(true);
    expect(holdersOf(draft)).toEqual(['beto']);
    expect(toRequest(draft)).toEqual({
      version: 3,
      description: 'Otra',
      give: ['beto'],
      take: ['ana'],
    });
    draft = undo(undo(draft, 'beto'), 'ana');
    draft = { ...draft, description: 'Abre y cierra' };
    expect(isDirty(draft)).toBe(false);
    expect(holdersOf(draft)).toEqual(['ana']);
  });

  it('users-E62: el nombre y la descripción van limpios; vacía, la descripción se borra', () => {
    const draft = { ...fromRole(role(), []), name: '  Encargado   de turno ', description: '  ' };
    expect(toRequest(draft)).toEqual({ version: 3, name: 'Encargado de turno', description: null });
  });

  it('users-E63: un rol nuevo pide nombre, permisos y a quiénes se les da', () => {
    const draft = give(
      toggle({ ...emptyDraft('Cajero'), description: 'Cobra' }, 'users.view'),
      'ana',
    );
    expect(isDirty(emptyDraft())).toBe(false);
    expect(toRequest(draft)).toEqual({
      name: 'Cajero',
      description: 'Cobra',
      permissions: ['users.view'],
      give: ['ana'],
    });
  });

  it('users-E38: duplicar copia nombre, descripción y permisos, sin personas, y ya hay algo para guardar', () => {
    const draft = duplicateOf(role());
    expect(draft).toMatchObject({
      id: null,
      name: 'Copia de Encargado',
      description: 'Abre y cierra',
    });
    expect(draft.permissions).toEqual(['users.cut', 'users.view']);
    expect(holdersOf(draft)).toEqual([]);
    expect(isDirty(draft)).toBe(true);
  });

  it('users-E37, E65: sin nombre, con un nombre que ya está o sin permisos, se dice todo junto', () => {
    expect(validate(emptyDraft(), context())).toEqual({ name: 'role-no-name', permissions: true });
    const taken = toggle(emptyDraft('administrador'), 'users.view');
    expect(validate(taken, context()).name).toBe('role-name-taken');
    const same = { ...fromRole(role(), ['ana']), name: 'ENCARGADO' };
    expect(validate(same, context())).toEqual({});
  });

  it('users-E65: quien se quedaría sin roles se marca en su renglón', () => {
    const people = { ana: ['r1'], beto: ['r1', 'admin'] };
    const draft = take(take(fromRole(role(), ['ana', 'beto']), 'ana'), 'beto');
    expect(validate(draft, context(people)).people).toEqual({ ana: 'no-roles' });
  });

  it('users-E56: sacarse a sí mismo «Administrar roles» se marca con el permiso', () => {
    const mine = take(fromRole(admin, ['yo']), 'yo');
    const ctx = context({ yo: ['admin', 'r1'] });
    expect(validate(mine, ctx).self).toBe('roles.manage');
    const fewer = toggle(fromRole(admin, ['yo']), 'roles.manage');
    expect(validate(fewer, ctx).self).toBe('roles.manage');
    const other = toggle(fromRole(role(), ['yo']), 'users.cut');
    expect(validate(other, ctx).self).toBeUndefined();
  });

  it('409 changed: lo que cambió el borrador vuelve a quedar encima del rol nuevo', () => {
    let draft = toggle(fromRole(role(), ['ana']), 'offline.work');
    draft = give({ ...draft, description: 'Mía' }, 'beto');
    const fresh = role({ version: 4, name: 'Encargado general', permissions: ['users.view'] });
    const again = reapply(draft, fresh, ['ana', 'caro']);
    expect(again).toMatchObject({ version: 4, name: 'Encargado general', description: 'Mía' });
    expect(again.permissions).toEqual(['offline.work', 'users.view']);
    expect(holdersOf(again)).toEqual(['ana', 'caro', 'beto']);
    expect(toRequest(again)).toEqual({
      version: 4,
      description: 'Mía',
      permissions: ['offline.work', 'users.view'],
      give: ['beto'],
    });
  });

  it('dar a quien ya lo tenía después de sacárselo lo deja como estaba; sacar a quien se le daba, también', () => {
    const draft = fromRole(role(), ['ana']);
    expect(give(take(draft, 'ana'), 'ana')).toMatchObject({ give: [], take: [] });
    expect(take(give(draft, 'beto'), 'beto')).toMatchObject({ give: [], take: [] });
  });

  it('duplicar uno sin descripción la deja vacía; un nombre cambiado queda encima del rol nuevo', () => {
    expect(duplicateOf(role({ description: null })).description).toBe('');
    const draft = { ...fromRole(role(), []), name: 'Mío' };
    expect(reapply(draft, role({ version: 9, name: 'De otro' }), []).name).toBe('Mío');
  });
});
